"use server";

import { db } from "@/shared/server_constants";
import { findMeetings } from "../../firestore";
import { getSession, isAuthorizedSession } from "../../session-store";
import { NextResponse } from "next/server";

export async function DELETE() {
  const sessionData = await getSession();
  if (!isAuthorizedSession(sessionData)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const meetings = await findMeetings(sessionData.userId);

  const batch = db.batch();
  meetings.forEach((meeting) => {
    batch.delete(db.doc(`meeting/${meeting.meetingCode}`));
  });
  // We cannot delete the user itself, because we will not receive another token, because the app is still linked with that specific account
  // TODO Investigate this further
  await batch.commit();
  return new NextResponse(null, { status: 204 });
}
