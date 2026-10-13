import { Credentials, getSession, setSession } from "@/app/session-store";
import {
  START_MEETING_URL,
  createOauth2Client,
  db,
} from "@/shared/server_constants";
import { NextRequest, NextResponse } from "next/server";
import { updateUserInfo } from "../updateUserInfo";
import { Logger } from "@/log";
import { User } from "@hangup/shared";

const logger = new Logger("get-token");

export async function GET(req: NextRequest) {
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    // An error response e.g. error=access_denied
    // TODO Make this visible to the user better
    return new NextResponse(errorParam, { status: 500 });
  }

  const session = await getSession();

  if (session === undefined) {
    logger.error("Expected to find session, but didn't");
    return new NextResponse("Could not find session", { status: 400 });
  }

  if (!("state" in session) || typeof session.state === "undefined") {
    logger.error("Could not find state in session", { session });
    return new NextResponse("Could not find state in session", { status: 400 });
  }

  const state = req.nextUrl.searchParams.get("state");

  if (state !== session.state) {
    const errorMsg = `Stored state ${session.state} does not match received state ${state}`;
    logger.error(errorMsg, { session });
    return new NextResponse(errorMsg, { status: 400 });
  }

  // Get access and refresh tokens (if access_type is offline)
  // TODO Type check
  const oauth2Client = createOauth2Client(),
    code = req.nextUrl.searchParams.get("code");
  if (code === null) {
    logger.error("No code transmitted");
    return new NextResponse("No code transmitted", { status: 400 });
  }
  const credentials = (await oauth2Client.getToken(code)).tokens as Credentials;

  const userInfoResponse = await oauth2Client.getTokenInfo(
    credentials.access_token,
  );
  // TODO Need to get refresh_token from data if existing user.
  oauth2Client.setCredentials(credentials);

  try {
    // get-token manages `credentials` itself (it merges in the refresh_token
    // fetched from Firestore for returning users below), so only take the
    // profile fields from updateUserInfo and do NOT let it overwrite them.
    const { name, picture } = await updateUserInfo(credentials);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = userInfoResponse.sub!;
    logger.info(`User ${userId} authenticated successfully`, { userId });

    // Fetch or update refresh_token
    const userDoc = await db.collection("user").doc(userId).get();

    if (credentials.refresh_token) {
      logger.info(`Updating refresh_token for user ${userId} `, { userId });
      await userDoc.ref.set(
        { refresh_token: credentials.refresh_token },
        { merge: true },
      );
    } else {
      if (!userDoc.exists) {
        logger.error(`Did not receive refresh_token for user ${userId}`, {
          userId,
        });
        return new NextResponse("An unexpected error occurred", {
          status: 500,
        });
      }

      logger.info(`Returning user ${userId}. Getting refresh_token`, {
        userId,
      });
      credentials.refresh_token = (userDoc.data() as User).refresh_token;
    }

    await setSession({
      // TODO Observation google-apis have horrible typing
      userId,
      hasAcceptedPrivacyPolicy: true,
      credentials,
      name,
      picture,
    });
  } catch (error) {
    logger.error(error, { additional: credentials });
    throw new Error(
      "This shouldn't happen. Token should be valid at this point.",
      { cause: error },
    );
  }

  return NextResponse.redirect(START_MEETING_URL);
}
