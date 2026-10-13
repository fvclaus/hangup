/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable new-cap */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as handler from "./route";
import { findMeeting, findUser } from "../../../firestore";
import { getSession } from "@/app/session-store";
import { google } from "googleapis";
import { NextRequest } from "next/server";
import {
  authenticatedSession,
  mockAuthenticatedSession,
} from "@/app/session-store.mock";

describe("/api/meeting/[meetingCode]", () => {
  beforeEach(() => {
    vi.mock("./../../../firestore");
    vi.mock("./../../../session-store");
    vi.mock("googleapis");
    vi.resetAllMocks();
    const findMeetingMock: typeof findMeeting = async (params) => {
      const { meetingCode } = await params;
      switch (meetingCode) {
        case "existingMeeting": {
          return {
            code: meetingCode,
            uri: meetingCode,
            userId: authenticatedSession.userId,
            name: "name",
            scheduledEndTime: "scheduledEndTime",
          };
        }
        case "missingMeeting": {
          return undefined;
        }
        default: {
          throw new Error(`Unknown ${meetingCode}`);
        }
      }
    };
    vi.mocked(findMeeting).mockImplementation(findMeetingMock);
    mockAuthenticatedSession();
  });

  describe("GET", () => {
    it("should return meeting details for a valid meeting code", async () => {
      const response = await handler.GET({} as NextRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(200);
      const data = (await response.json()) as unknown;
      expect(data).toEqual({
        uri: "existingMeeting",
        scheduledEndTime: "scheduledEndTime",
      });
    });

    it("should return 403 for an invalid meeting code", async () => {
      const response = await handler.GET({} as NextRequest, {
        params: Promise.resolve({ meetingCode: "missingMeeting" }),
      });
      expect(response.status).toBe(403);
    });

    it("should return 403 for a meeting code that belongs to other person", async () => {
      mockAuthenticatedSession({ userId: "otherUser" });
      const response = await handler.GET({} as NextRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(vi.mocked(getSession)).toHaveBeenCalledOnce();
      expect(vi.mocked(findMeeting)).toHaveBeenCalledOnce();
      expect(response.status).toBe(403);
    });
  });

  describe("DELETE", () => {
    // eslint-disable-next-line init-declarations
    let validDeleteRequest: NextRequest;

    beforeEach(() => {
      validDeleteRequest = new NextRequest(
        "http://localhost/api/meeting/existingMeeting?userId=existingUser",
      );
      validDeleteRequest.headers.set("X-CLOUDTASKS-TASKNAME", "task");
      validDeleteRequest.headers.set("Authorization", "Bearer valid_token");

      vi.mocked(findUser).mockImplementation((userId) => {
        switch (userId) {
          case "missingUser": {
            return Promise.resolve({
              exists: false,
              data: () => undefined,
            } as any);
          }
          case "existingUser": {
            return Promise.resolve({
              exists: true,
              data: () => ({
                refresh_token: "refresh_token",
              }),
            } as any);
          }
          default: {
            throw new Error(`Unexpected user ${userId}`);
          }
        }
      });

      vi.mocked(google.auth.OAuth2.prototype.verifyIdToken).mockImplementation(
        ({ idToken }: { idToken: string }) => {
          switch (idToken) {
            case "invalid_token": {
              throw new Error("Invalid token");
            }
            case "wrong_sa": {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return {
                getPayload: () => ({
                  email: "other@vitest.iam.gserviceaccount.com",
                }),
              } as any;
            }
            case "valid_token": {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return {
                getPayload: () => ({
                  email: "backend-app@vitest.iam.gserviceaccount.com",
                }),
              } as any;
            }
            default: {
              throw new Error(`Unknown token ${idToken}`);
            }
          }
        },
      );

      const endActiveConferenceMock = vi
        .fn()
        .mockResolvedValue({ status: 200 });
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          endActiveConference: endActiveConferenceMock,
        },
      } as any);
    });

    it("should fail if gcloud header is missing", async () => {
      const req = new NextRequest(
          "http://localhost/api/meeting/existingMeeting",
        ),
        response = await handler.DELETE(req, {
          params: Promise.resolve({ meetingCode: "existingMeeting" }),
        });
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("No X-CLOUDTASKS-TASKNAME header");
    });

    it("should fail if Authorization header is missing", async () => {
      const req = new NextRequest(
        "http://localhost/api/meeting/existingMeeting",
      );
      req.headers.set("X-CLOUDTASKS-TASKNAME", "task");

      const response = await handler.DELETE(req, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Missing Authorization Header");
    });

    it("should fail if token validation fails", async () => {
      const req = new NextRequest(
        "http://localhost/api/meeting/existingMeeting",
      );
      req.headers.set("X-CLOUDTASKS-TASKNAME", "task");
      req.headers.set("Authorization", "Bearer invalid_token");

      const response = await handler.DELETE(req, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Invalid OIDC token");
    });

    it("should fail if token has the wrong sa", async () => {
      const req = new NextRequest(
        "http://localhost/api/meeting/existingMeeting",
      );
      req.headers.set("X-CLOUDTASKS-TASKNAME", "task");
      req.headers.set("Authorization", "Bearer wrong_sa");

      const response = await handler.DELETE(req, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Unexpected service account");
    });

    it("should return fail if userId parameter is missing", async () => {
      const req = new NextRequest(
        "http://localhost/api/meeting/existingMeeting",
      );
      req.headers.set("X-CLOUDTASKS-TASKNAME", "task");
      req.headers.set("Authorization", "Bearer valid_token");

      const response = await handler.DELETE(req, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Missing userId parameter");
    });

    it("should succeed if user does not exist", async () => {
      const req = new NextRequest(
        "http://localhost/api/meeting/existingMeeting?userId=missingUser",
      );
      req.headers.set("X-CLOUDTASKS-TASKNAME", "task");
      req.headers.set("Authorization", "Bearer valid_token");

      const response = await handler.DELETE(req, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(response.status).toBe(204);
    });

    it("should succeed if meeting does not exist", async () => {
      const response = await handler.DELETE(validDeleteRequest, {
        params: Promise.resolve({ meetingCode: "missingMeeting" }),
      });
      expect(vi.mocked(findMeeting)).toHaveBeenCalledOnce();
      expect(
        vi.mocked(google.meet("v2").spaces.endActiveConference),
      ).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(204);
    });

    it("should end the meeting and return the response status", async () => {
      const response = await handler.DELETE(validDeleteRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(
        vi.mocked(google.meet("v2").spaces.endActiveConference),
      ).toHaveBeenCalledOnce();
      expect(response.status).toBe(200);
    });

    it("should ignore deleted or permission denied from endActiveConference", async () => {
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          endActiveConference: vi.fn().mockRejectedValue({ status: 403 }),
        },
      } as any);

      const response = await handler.DELETE(validDeleteRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(
        vi.mocked(google.meet("v2").spaces.endActiveConference),
      ).toHaveBeenCalledOnce();
      expect(response.status).toBe(204);
    });

    it("should pass through other errors from endActiveConference", async () => {
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          endActiveConference: vi.fn().mockRejectedValue({ status: 502 }),
        },
      } as any);

      const response = await handler.DELETE(validDeleteRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(
        vi.mocked(google.meet("v2").spaces.endActiveConference),
      ).toHaveBeenCalledOnce();
      expect(response.status).toBe(502);
    });
    it("should pass through other errors as 500", async () => {
      vi.mocked(google.meet).mockReturnValue({
        spaces: {
          endActiveConference: vi.fn().mockRejectedValue("my Error"),
        },
      } as any);

      const response = await handler.DELETE(validDeleteRequest, {
        params: Promise.resolve({ meetingCode: "existingMeeting" }),
      });
      expect(
        vi.mocked(google.meet("v2").spaces.endActiveConference),
      ).toHaveBeenCalledOnce();
      expect(response.status).toBe(500);
    });
  });
});
