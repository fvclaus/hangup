import {
  Meeting,
  isMeetingEndAfterOffset,
  MEETING_END_MINUTES_OFFSET,
} from "@hangup/shared";
import {
  getCredentials,
  getSession,
  isAuthorizedSession,
} from "@/app/session-store";
import {
  CLOUD_TASKS_SERVICE_ACCOUNT,
  PROJECT_ID,
  QUEUE_LOCATION,
  SITE_BASE,
  SITE_BASE_CLOUD_TASKS,
  cloudTasksClient,
} from "@/shared/server_constants";
import { google } from "googleapis";

import { differenceInSeconds, formatISO } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { saveMeeting } from "../../firestore";
import { z } from "zod";
import { Logger } from "@/log";

const logger = new Logger("meeting");

const RequestBodySchema = z.object({
  scheduledEndTime: z.iso
    .datetime({ offset: true })
    .refine(
      (value) => {
        return isMeetingEndAfterOffset(new Date(value));
      },
      {
        message: `Datetime must be ${MEETING_END_MINUTES_OFFSET} minutes in future`,
      },
    )
    .pipe(z.coerce.date()),
});

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown,
    result = RequestBodySchema.safeParse(body);
  if (result.error) {
    return NextResponse.json(result.error.issues, { status: 400 });
  }

  const reqData = result.data;
  const sessionData = await getSession();

  if (!isAuthorizedSession(sessionData)) {
    return new NextResponse("User is not logged in", { status: 403 });
  }

  const oauthClient = getCredentials(sessionData.credentials);

  try {
    const space = await google.meet("v2").spaces.create({
        auth: oauthClient,
      }),
      meeting: Meeting = {
        scheduledEndTime: formatISO(reqData.scheduledEndTime),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        name: space.data.name!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        uri: space.data.meetingUri!,
        userId: sessionData.userId,
      };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const meetingCode = space.data.meetingCode!;
    logger.info(`Created meeting ${meetingCode}`, {
      meetingCode,
    });
    const secondsToEnd = Math.max(
        0,
        differenceInSeconds(reqData.scheduledEndTime, Date.now()),
      ),
      // TODO eslint Rule Hanging Promise
      [response] = await cloudTasksClient.createTask({
        parent: cloudTasksClient.queuePath(
          PROJECT_ID,
          QUEUE_LOCATION,
          "end-meetings1",
        ),
        task: {
          httpRequest: {
            httpMethod: "DELETE",
            url: `${SITE_BASE_CLOUD_TASKS}/api/meeting/${meetingCode}?userId=${sessionData.userId}`,
            headers: {
              "Content-Type": "application/json",
            },
            oidcToken: {
              serviceAccountEmail: CLOUD_TASKS_SERVICE_ACCOUNT,
              // Pin an explicit, host-independent audience so the DELETE
              // handler can verify the OIDC `aud` claim reliably. Without
              // this, the audience defaults to the (proxied) request URL,
              // which differs between Cloud Tasks and the server seen behind
              // ngrok/Cloud Run, breaking verification.
              audience: SITE_BASE,
            },
          },
          scheduleTime: {
            seconds: secondsToEnd + Date.now() / 1000,
          },
        },
      });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const taskName = response.name!;
    logger.info(
      `Created task with name ${taskName} to end meeting ${meetingCode} in ${secondsToEnd}s`,
      {
        meetingCode,
        taskName,
      },
    );
    await saveMeeting(meetingCode, meeting);
    return NextResponse.json({
      meetingCode,
    });
  } catch (e) {
    logger.error(e);
    return new NextResponse(
      `Creation of meeting failed: ${e instanceof Error ? e.message : e}`,
      { status: 500 },
    );
  }
}
