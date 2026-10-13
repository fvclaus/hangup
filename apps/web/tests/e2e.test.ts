/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
// TODO Just copied to avoid problems with other env variables
export const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
];
import { SESSION_ID_NAME } from "@hangup/shared";
import {
  BrowserContext,
  chromium,
  expect,
  Locator,
  Page,
  test,
} from "@playwright/test";
import {
  addMinutes,
  addSeconds,
  differenceInSeconds,
  format,
  formatISO,
  roundToNearestMinutes,
} from "date-fns";

// eslint-disable-next-line prefer-destructuring
const GMAIL_USER = process.env.GMAIL_USER;

// google-chrome-stable --remote-debugging-port=9222
test.describe("test", () => {
  test.describe.configure({ timeout: 200_000 });
  // eslint-disable-next-line init-declarations
  let page: Page;
  // eslint-disable-next-line init-declarations
  let context: BrowserContext;
  // eslint-disable-next-line init-declarations
  let signInWithGoogleButton: Locator;
  // eslint-disable-next-line init-declarations
  let createMeetingButton: Locator;
  // eslint-disable-next-line init-declarations
  let userMenuButton: Locator;
  // eslint-disable-next-line init-declarations
  let getStartedButton: Locator;

  async function revokeGoogleSignIn() {
    await page.goto("https://myaccount.google.com/connections");
    await page.waitForLoadState("domcontentloaded");
    const thirdPartyLink = page.getByRole("link", {
      name: "No Meeting Overtime",
    });
    if (
      !(await thirdPartyLink.isVisible({ timeout: 10_000 }).catch(() => false))
    ) {
      return;
    }
    await thirdPartyLink.click();
    // Google's connections page now links the app name to the app website.
    // If we were navigated away, go back and look for an inline remove button.
    await page.waitForTimeout(2_000);
    if (!page.url().includes("myaccount.google.com")) {
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
    }
    const deleteButton = page
      .getByRole("button", { name: "Delete all connections" })
      .or(page.getByRole("button", { name: /remove access/iu }))
      .or(page.getByRole("button", { name: /remove/iu }));
    await deleteButton.click({ timeout: 15_000 });
    const confirmButton = page
      .getByRole("button", { name: "Confirm" })
      .or(page.getByRole("button", { name: /ok|yes/iu }));
    await confirmButton.click({ timeout: 10_000 });
  }

  async function selectCorrectGmailAccount() {
    const LOGIN_LINK_SELECTORS = "css=[data-identifier]";
    await page.waitForSelector(LOGIN_LINK_SELECTORS);
    const loginLinks = await page.$$(LOGIN_LINK_SELECTORS);
    if (loginLinks.length > 1) {
      if (GMAIL_USER === undefined) {
        throw new Error(
          "There are multiple Google accounts for selection. Must set GMAIL_USER to be able to pick the correct user.",
        );
      }
      const userForLinks = [];
      for (const loginLink of loginLinks) {
        const userForLink = await loginLink.getAttribute("data-identifier");
        if (userForLink === GMAIL_USER) {
          await loginLink.click();
          return;
        }
        userForLinks.push(userForLink);
      }
      throw new Error(`Did not find ${GMAIL_USER} in ${userForLinks}`);
    } else if (loginLinks.length === 1) {
      await loginLinks.at(0)?.click();
    } else {
      throw new Error("Did not find any login links");
    }
  }

  async function signInWithGoogle(scopes: string[] = REQUIRED_SCOPES) {
    const appLink = page.locator("css=button[data-third-party-email]");
    await expect(appLink.or(createMeetingButton)).toBeVisible();
    if (await createMeetingButton.isVisible()) {
      // User already logged in
      return;
    }
    const continueButton = page.getByRole("button", { name: "Continue" });
    await page.waitForURL("**");
    await selectCorrectGmailAccount();
    await page.waitForURL("**");

    const notVerified = page.getByText(/given access/u);
    const additionalAccess = page.getByRole("heading", {
      name: /wants additional access/u,
    });
    const access = page.getByRole("heading", { name: /wants access/u });
    const signIn = page.getByRole("heading", {
      name: "Sign in to No Meeting Overtime",
    });

    try {
      await expect(
        notVerified.or(additionalAccess).or(access).or(signIn),
      ).toBeVisible();
    } catch (e) {
      if (page.url().includes("signin/challenge")) {
        throw new Error(
          "You must login in your Chrome browser (upper right) before starting the test, otherwise there could be an authentication prompt",
          { cause: e },
        );
      }
      throw e;
    }

    if (await notVerified.isVisible()) {
      await continueButton.click();
    }

    await expect(signIn.or(additionalAccess).or(access)).toBeVisible();

    if (await signIn.isVisible()) {
      await continueButton.click();
    }

    await expect(additionalAccess.or(access)).toBeVisible();
    for (const scope of scopes) {
      const locator = page.locator(`css=[data-value="${scope}"]`);
      if (await locator.isVisible()) {
        await locator.click();
      }
    }
    await continueButton.click();
    // Chrome shows a "Make Chrome your own" sync dialog after OAuth — dismiss it if present.
    await page
      .getByRole("button", { name: "Use Chrome without an account" })
      .click({ timeout: 5_000 })
      // eslint-disable-next-line no-empty-function
      .catch(() => {});
  }

  async function signInIfNecessary() {
    await expect(signInWithGoogleButton.or(getStartedButton)).toBeVisible();
    if (await signInWithGoogleButton.isVisible()) {
      await signInWithGoogleButton.click();
      await signInWithGoogle();
      await expect(createMeetingButton).toBeVisible();
    } else {
      await getStartedButton.click();
    }
  }

  test.beforeEach(async () => {
    const browser = await chromium.connectOverCDP("http://localhost:9222", {
      slowMo: 200,
    });
    [context] = browser.contexts();
    // Avoid running out of time because of long page compilation times
    page = await context.newPage();
    page.setDefaultTimeout(30_000);
    signInWithGoogleButton = page.getByRole("button", {
      name: "Sign in with Google",
    });
    createMeetingButton = page.getByRole("button", { name: "Create Meeting" });
    userMenuButton = page.getByRole("button", { name: "User Menu" });
    getStartedButton = page.getByRole("button", { name: "Get started" });
  });

  test.afterEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (page !== undefined) {
      await page.close();
    }
  });

  test("happy path", async () => {
    await page.goto("http://localhost:3000");
    await signInIfNecessary();
    const shortMeetingEnd = addSeconds(Date.now(), 30);

    const response = await page
      .context()
      .request.post("http://localhost:3000/api/meeting", {
        data: {
          scheduledEndTime: formatISO(shortMeetingEnd),
        },
      });
    if (response.status() !== 200) {
      console.error(await response.text());
    }
    expect(response.status()).toEqual(200);
    const body = (await response.json()) as { meetingCode: string };
    await page.goto(`http://localhost:3000/meeting/${body.meetingCode}`);
    const successText = page.getByText(/Meeting with code .* created/u);
    await expect(successText).toBeVisible({ timeout: 45_000 });
    const pagePromise = page
      .context()
      .waitForEvent("page", (p) =>
        p.url().startsWith("https://meet.google.com/"),
      );
    await page.getByRole("link", { name: "Join now" }).click();
    const newPage = await pagePromise;
    await newPage.bringToFront();
    await expect(
      newPage.getByRole("heading", {
        name: "Your host ended the meeting for everyone",
      }),
    ).toBeVisible({
      timeout: (differenceInSeconds(shortMeetingEnd, new Date()) + 10) * 1000,
    });
  });

  test("test accept privacy policy", async () => {
    await context.clearCookies({ name: SESSION_ID_NAME });
    await page.goto("http://localhost:3000");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    const acceptPrivacyPolicyCheckbox = page.getByRole("checkbox", {
      name: "By clicking Sign In With Google I have read and agree to",
    });
    await expect(acceptPrivacyPolicyCheckbox).toBeVisible();
    await signInWithGoogleButton.click();
    // TODO https://github.com/microsoft/playwright/issues/23377
    await expect(
      page.getByText("You must accept the privacy policy before continuing"),
    ).toBeVisible();
    await acceptPrivacyPolicyCheckbox.click();
    await signInWithGoogleButton.click();
    await signInWithGoogle();
    await userMenuButton.click();
    await page.getByRole("menuitem", { name: "Logout" }).click();
    await expect(signInWithGoogleButton).toBeVisible();
    await expect(acceptPrivacyPolicyCheckbox).toBeChecked();
  });

  test("should display login button after removing connection to app", async () => {
    await page.goto("http://localhost:3000");
    await signInIfNecessary();
    await revokeGoogleSignIn();
    await page.goto("http://localhost:3000");
    await expect(signInWithGoogleButton).toBeVisible();
  });

  test("should display missing scopes", async () => {
    await revokeGoogleSignIn();
    await page.goto("http://localhost:3000");
    await signInWithGoogleButton.click();
    await signInWithGoogle([]);
    await expect(signInWithGoogleButton).toBeVisible();
    await expect(page.getByText("Missing permission")).toBeVisible();
    await signInWithGoogleButton.click();
    // There is no selection, because it is only a single permission
    await signInWithGoogle();
    await expect(createMeetingButton).toBeVisible();
  });

  test("should show created meetings and delete account", async () => {
    await page.goto("http://localhost:3000");
    await signInIfNecessary();
    const meetingEnd = roundToNearestMinutes(addMinutes(Date.now(), 20), {
      roundingMethod: "ceil",
    });
    await page
      .getByLabel("When should the meeting end?")
      .fill(format(meetingEnd, "HH:mm"));

    await createMeetingButton.click();
    const successText = page.getByText(/Meeting with code .* created/u);
    await expect(successText).toBeVisible({ timeout: 45_000 });
    const url = page.url();
    const meetingCode = url.split("/").pop();
    await userMenuButton.click();
    await page.getByRole("menuitem", { name: "My Meetings" }).click();
    await expect(page.getByRole("cell", { name: meetingCode })).toBeVisible({
      timeout: 15_000,
    });
    await userMenuButton.click();
    const beforeRes = await page
      .context()
      .request.get(`http://localhost:3000/api/meeting/${meetingCode}`);
    expect(beforeRes.ok()).toBeTruthy();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Delete Data" }).click();
    await page.getByRole("button", { name: "Delete Everything" }).click();

    await expect(signInWithGoogleButton).toBeVisible();
    const afterRes = await page
      .context()
      .request.get(`http://localhost:3000/api/meeting/${meetingCode}`);
    expect(afterRes.ok()).toBeFalsy();
  });
});
