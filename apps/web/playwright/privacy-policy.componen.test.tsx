import { expect, test } from "@playwright/experimental-ct-react";
import Page from "@/app/privacy-policy/page";

test.describe("Privacy Policy", () => {
  test("visual test", async ({ mount }) => {
    const component = await mount(<Page />);
    await expect(component).toHaveScreenshot();
  });
});
