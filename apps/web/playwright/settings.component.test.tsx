import { test, expect } from "@playwright/experimental-ct-react";
import { Settings } from "@/app/settings/components/settings";

test.describe("Settings", () => {
  test("form should be in disabled state when submitting", async ({
    mount,
  }) => {
    const component = await mount(<Settings />);
    const deleteDialog = component.getByRole("dialog", {
      name: "Delete Data",
    });
    await expect(deleteDialog).not.toBeVisible();
    await component.getByRole("button", { name: "Delete Data" }).click();
    await expect(deleteDialog).toBeVisible();
    const sendResponse = Promise.withResolvers();
    await component.page().route("**/api/user", async (route) => {
      await sendResponse.promise;
      await route.fulfill({
        status: 204,
      });
    });
    const deleteEverythingButton = component.getByRole("button", {
      name: "Delete Everything",
    });
    await deleteEverythingButton.click();
    await expect(
      component.getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();
    await expect(
      component.getByRole("status", { name: "loading" }),
    ).toBeVisible();
    await expect(deleteEverythingButton).toBeDisabled();
    // Intercept logout navigation so the CT page isn't closed when window.location.href is set
    await component.page().route("**/api/logout", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });
    sendResponse.resolve(true);
    await expect(deleteDialog).not.toBeVisible();
    await component.page().waitForURL("**/api/logout");
  });

  test("form should display error message", async ({ mount }) => {
    const component = await mount(<Settings />);
    await component.getByRole("button", { name: "Delete Data" }).click();
    await component.page().route("**/api/user", async (route) => {
      await route.fulfill({
        status: 500,
        body: "A playwright test error occurred",
      });
    });
    const deleteEverythingButton = component.getByRole("button", {
      name: "Delete Everything",
    });
    await deleteEverythingButton.click();
    await expect(
      component
        .getByRole("alert")
        .getByRole("heading", { name: "Could not delete your account" }),
    ).toBeVisible();
    await expect(
      component
        .getByRole("alert")
        .getByText("A playwright test error occurred"),
    ).toBeVisible();
    await expect(deleteEverythingButton).toBeEnabled();
  });

  test("cancel button should close dialog", async ({ mount }) => {
    const component = await mount(<Settings />);
    await component.getByRole("button", { name: "Delete Data" }).click();
    const deleteDialog = component.getByRole("dialog", {
      name: "Delete Data",
    });
    await expect(deleteDialog).toBeVisible();
    await component.getByRole("button", { name: "Cancel" }).click();
    await expect(deleteDialog).not.toBeVisible();
  });

  test("visual test", async ({ mount }) => {
    const component = await mount(<Settings />);
    await expect(component).toHaveScreenshot();
  });

  test("delete user dialog visual test", async ({ mount }) => {
    const component = await mount(<Settings />);
    await component.getByRole("button", { name: "Delete Data" }).click();
    const deleteDialog = component.getByRole("dialog", {
      name: "Delete Data",
    });
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog).toHaveScreenshot();
  });
});
