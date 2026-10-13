import { db } from "@/shared/server_constants";
import { Meeting } from "@hangup/shared";
import { RouteParams } from "./api/meeting/[meetingCode]/route";
import { compareDesc } from "date-fns";

// Don't need to unit test this. One E2E Test should be enough
export async function findMeeting(
  params: RouteParams,
): Promise<(Meeting & { code: string }) | undefined> {
  const { meetingCode } = await params,
    meetingDocs = await db.collection("meeting").doc(meetingCode).get();
  if (!meetingDocs.exists) {
    return undefined;
  }
  const meeting = meetingDocs.data() as Meeting;
  return {
    ...meeting,
    code: meetingCode,
  };
}

export async function findMeetings(
  userId: string,
): Promise<(Meeting & { meetingCode: string })[]> {
  const meetings = await db
    .collection("meeting")
    .where("userId", "==", userId)
    .get();
  return meetings.docs
    .map((doc) => {
      const data = doc.data() as Meeting;
      return {
        meetingCode: doc.id,
        ...data,
      };
    })
    .sort((a: Meeting, b: Meeting) => {
      return compareDesc(
        new Date(a.scheduledEndTime),
        new Date(b.scheduledEndTime),
      );
    });
}

export async function findUser(userId: string) {
  return await db.collection("user").doc(userId).get();
}
export async function saveMeeting(meetingCode: string, meeting: Meeting) {
  await db.collection("meeting").doc(meetingCode).set(meeting);
}
