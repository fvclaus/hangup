import { expect, test } from "@playwright/experimental-ct-react";
import Page from "@/app/report-issue/page";

test.describe("Report Issue", () => {
  test("visual test", async ({ mount }) => {
    const component = await mount(<Page />);
    await expect(component).toHaveScreenshot();
  });
});
