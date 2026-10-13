import {
  JoinMeeting,
  MeetingData,
} from "@/app/meeting/[meetingCode]/_components/join-meeting";
import { expect, test } from "@playwright/experimental-ct-react";
import { add, formatISO, sub } from "date-fns";

test.describe("Join Meeting", () => {
  const meeting: Omit<MeetingData, "scheduledEndTime"> = {
    code: "kgu-agcv-jxk",
    uri: "https://meet.google.com/kgu-agcv-jxk",
  };

  const now = new Date("2024-02-02T10:00:00");

  // eslint-disable-next-line @typescript-eslint/unbound-method
  test("visual test", async ({ mount }) => {
    const scheduledEndTime = add(now, { minutes: 5 });
    const component = await mount(
      <JoinMeeting
        meeting={{ scheduledEndTime: formatISO(scheduledEndTime), ...meeting }}
      />,
    );
    await component.page().clock.setFixedTime(now);
    await expect(component).toHaveScreenshot();
  });

  // eslint-disable-next-line @typescript-eslint/unbound-method
  test("should calculate remaining time", async ({ mount }) => {
    const scheduledEndTime = sub(now, { minutes: 5 });
    const component = await mount(
      <JoinMeeting
        meeting={{
          scheduledEndTime: formatISO(scheduledEndTime),
          ...meeting,
        }}
      />,
    );
    await component.page().clock.setFixedTime(now);
    await expect(
      component.getByText("We tried to end the meeting at 09:55 AM"),
    ).toBeVisible();
    await expect(
      component.getByRole("button", { name: "Join now" }),
    ).not.toBeVisible();
  });
});
