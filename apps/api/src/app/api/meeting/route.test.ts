/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable new-cap */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as handler from "./route";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { add, formatISO } from "date-fns";
import { saveMeeting } from "@/app/firestore";
import { CloudTasksClient } from "@google-cloud/tasks";
import type { $ZodIssue } from "zod/v4/core";
import {
  mockAuthenticatedSession,
  mockUnauthorizedSession,
} from "@/app/session-store.mock";

describe("/api/meeting/[meetingCode]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mock("./../../session-store");
    vi.mock("./../../firestore");
    vi.mock("googleapis");
    vi.mock("@google-cloud/tasks", () => {
      // This is necessary, but I don't understand why the mocking in the test doesn't work without it.
      // eslint-disable-next-line no-shadow
      const CloudTasksClient = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      CloudTasksClient.prototype.createTask = vi.fn(() =>
        Promise.resolve([{ name: "task123" }]),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      CloudTasksClient.prototype.queuePath = vi.fn(() => "queuePath");
      return { CloudTasksClient };
    });
    mockAuthenticatedSession();
  });

  async function expectBadRequest(
    response: NextResponse,
    error: Partial<$ZodIssue>,
  ) {
    expect(response.status).toBe(400);
    const errors = (await response.json()) as string[];
    expect(errors[0]).toEqual(expect.objectContaining(error));
  }

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({ invalid: "data" }),
        }),
        response = await handler.POST(req);
      await expectBadRequest(response, {
        path: ["scheduledEndTime"],
        message: "Invalid input: expected string, received undefined",
      });
    });

    it("should fail if it is not a date", async () => {
      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({ scheduledEndTime: "foo" }),
        }),
        response = await handler.POST(req);
      await expectBadRequest(response, {
        path: ["scheduledEndTime"],
        message: "Invalid ISO datetime",
      });
    });

    it("should fail if time is not far enough in the future", async () => {
      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({
            scheduledEndTime: formatISO(add(new Date(), { minutes: 2 })),
          }),
        }),
        response = await handler.POST(req);
      await expectBadRequest(response, {
        path: ["scheduledEndTime"],
        message: "Datetime must be 5 minutes in future",
      });
    });

    it("should return 403 if user is not logged in", async () => {
      mockUnauthorizedSession();
      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({
            scheduledEndTime: formatISO(add(new Date(), { minutes: 10 })),
          }),
        }),
        response = await handler.POST(req);
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("User is not logged in");
    });

    it("should return 500 if meeting creation fails", async () => {
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          create: vi.fn().mockRejectedValue(new Error("Google API error")),
        },
      } as any);

      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({
            scheduledEndTime: formatISO(add(new Date(), { minutes: 10 })),
          }),
        }),
        response = await handler.POST(req);
      expect(response.status).toBe(500);
      expect(await response.text()).toBe(
        "Creation of meeting failed: Google API error",
      );
    });

    it("should create a meeting and return the meeting data", async () => {
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          create: vi.fn().mockResolvedValue({
            data: {
              name: "Test Meeting",
              meetingUri: "https://meet.google.com/test-meeting",
              meetingCode: "meeting123",
            },
          }),
        },
      } as any);

      // Const CloudTasksClientMock = vi.fn()
      // CloudTasksClientMock.prototype.createTask = vi.fn(() => Promise.resolve());
      // CloudTasksClientMock.prototype.queuePath = vi.fn(() => "queuePath");
      vi.mocked(CloudTasksClient.prototype.createTask).mockResolvedValue([
        { name: "task123" },
      ] as any);

      const req = new NextRequest("http://localhost/api/meeting", {
          method: "POST",
          body: JSON.stringify({
            scheduledEndTime: formatISO(add(new Date(), { minutes: 10 })),
          }),
        }),
        response = await handler.POST(req);
      expect(response.status).toBe(200);
      const data: unknown = await response.json();
      expect(data).toEqual({
        meetingCode: "meeting123",
      });
      expect(vi.mocked(saveMeeting)).toHaveBeenCalledOnce();
    });
  });
});
