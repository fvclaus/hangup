import {
  CLOUD_TASKS_SERVICE_ACCOUNT,
  SITE_BASE,
  createOauth2Client,
} from "@/shared/server_constants";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { findMeeting, findUser } from "../../../firestore";
import { getSession, isAuthorizedSession } from "@/app/session-store";
import { Logger } from "@/log";

const logger = new Logger("meeting/[meetingCode]");

export type RouteParams = Promise<{
  meetingCode: string;
}>;

export async function GET(req: NextRequest, props: { params: RouteParams }) {
  const sessionData = await getSession();

  if (!isAuthorizedSession(sessionData)) {
    return new NextResponse("Unauthenticated", { status: 403 });
  }

  const meeting = await findMeeting(props.params);
  if (meeting === undefined) {
    return new NextResponse("Unauthenticated", { status: 403 });
  }

  if (sessionData.userId !== meeting.userId) {
    logger.error(
      `User ${sessionData.userId} tried to access meeting ${meeting.code} of other user`,
      { userId: sessionData.userId, meetingCode: meeting.code },
    );
    return new NextResponse("Unauthenticated", { status: 403 });
  }

  return NextResponse.json({
    scheduledEndTime: meeting.scheduledEndTime,
    uri: meeting.uri,
  });
}

export async function DELETE(req: NextRequest, props: { params: RouteParams }) {
  const params = await props.params;
  const { meetingCode } = params;
  const taskName = req.headers.get("X-CLOUDTASKS-TASKNAME");
  if (taskName === null) {
    logger.error("No X-CLOUDTASKS-TASKNAME header", { meetingCode });
    return new NextResponse(`No X-CLOUDTASKS-TASKNAME header`, { status: 403 });
  }

  const oauth2Client = createOauth2Client(),
    idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (idToken === undefined) {
    logger.error(`[${taskName}]: Missing authorization header`, {
      taskName,
      meetingCode,
    });
    return new NextResponse("Missing Authorization Header", { status: 403 });
  }
  try {
    // The task is created with an explicit, host-independent audience
    // (SITE_BASE) in src/app/api/meeting/route.ts, so verify the OIDC `aud`
    // claim against that same constant. Deriving it from the request URL is
    // unreliable behind ngrok/Cloud Run where the proxied host differs.
    const login = await oauth2Client.verifyIdToken({
      idToken,
      audience: SITE_BASE,
    });
    if (CLOUD_TASKS_SERVICE_ACCOUNT !== login.getPayload()?.email) {
      logger.error(
        `[${taskName}]: OIDC token has the wrong mail: ${login.getPayload()?.email} instead of ${CLOUD_TASKS_SERVICE_ACCOUNT}`,
        { taskName, meetingCode },
      );
      return new NextResponse("Unexpected service account", { status: 403 });
    }
  } catch (error) {
    logger.error(error, { taskName, meetingCode });
    return new NextResponse("Invalid OIDC token", { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");

  if (userId === null) {
    logger.error(`[${taskName}]: Missing userId parameter`, {
      taskName,
      meetingCode,
    });
    return new NextResponse("Missing userId parameter", { status: 400 });
  }

  const userDoc = await findUser(userId),
    user = userDoc.data();

  if (!userDoc.exists || user === undefined) {
    logger.error(`[${taskName}]: Did not find user ${userId}`, {
      taskName,
      meetingCode,
    });
    return new NextResponse(undefined, { status: 204 });
  }

  oauth2Client.setCredentials({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    refresh_token: user.refresh_token,
  });

  const meeting = await findMeeting(props.params);
  if (meeting === undefined) {
    logger.error(`[${taskName}]: Did not find meeting`, {
      taskName,
      meetingCode,
    });
    return new NextResponse(undefined, { status: 204 });
  }

  try {
    const response = await google.meet("v2").spaces.endActiveConference({
      name: meeting.name,
      auth: oauth2Client,
    });
    logger.info(`[${taskName}]: Ended meeting ${meeting.code}`, {
      meetingCode,
      taskName,
    });
    // TODO Maybe make meetings subcollection of User?
    // TODO Keep or delete meeting?
    return new NextResponse(undefined, { status: response.status });
  } catch (e: unknown) {
    // TODO How to handle 'There is no active conference for the given space.'?
    if (
      typeof e === "object" &&
      e !== null &&
      "status" in e &&
      typeof e.status === "number"
    ) {
      const { status } = e;
      if (status === 403) {
        // Deleted or permission denied
        return new NextResponse(undefined, { status: 204 });
      }
      logger.error(e, { meetingCode, taskName });
      return new NextResponse(undefined, { status });
    }
    logger.error(e, { meetingCode, taskName });
    return new NextResponse(undefined, { status: 500 });
  }
}
