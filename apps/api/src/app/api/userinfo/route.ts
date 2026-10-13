import { AuthenticatedUserInfo } from "@hangup/shared";
import { getSession, setSession } from "@/app/session-store";
import { NextResponse } from "next/server";
import { updateUserInfo } from "../updateUserInfo";
import { getMissingScopes } from "@/shared/server_constants";
import { Logger } from "@/log";

const logger = new Logger("userinfo");

// TODO Type responses
export async function GET(): Promise<Response> {
  const sessionData = await getSession();

  if (
    sessionData === undefined ||
    !sessionData.hasAcceptedPrivacyPolicy ||
    "state" in sessionData
  ) {
    return NextResponse.json({
      authenticated: false,
      hasAcceptedPrivacyPolicy: false,
    });
  }

  // TODO Return from session, if 'expired' is not expired.

  try {
    const newUserInfo = await updateUserInfo(sessionData.credentials);

    const newSessionData = {
      ...sessionData,
      ...newUserInfo,
    };

    await setSession(newSessionData);

    const userInfo: AuthenticatedUserInfo & { missingScopes: string[] } = {
      authenticated: true,
      hasAcceptedPrivacyPolicy: true,
      name: newSessionData.name,
      picture: newSessionData.picture,
      scopes: newSessionData.credentials.scope,
      id: newSessionData.userId,
      // The keyless frontend gates authenticated routes on this (it can't read
      // the session server-side), so resolve it here once per request.
      missingScopes: getMissingScopes(newSessionData.credentials.scope),
    };

    return NextResponse.json(userInfo);
  } catch (error) {
    const headers = new Headers();
    headers.set("Content-Type", "text/plain");
    if (
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      if (error.message === "invalid_grant" || error.status === 401) {
        // TODO Reset to new sessions
        await setSession({
          hasAcceptedPrivacyPolicy: false,
        });
        logger.debug("Tokens expired or revoked", {
          userId: sessionData.userId,
        });
        return new NextResponse("Tokens expired or revoked", {
          status: error.status,
          headers,
        });
      }
    }
    logger.error(error, { userId: sessionData.userId });
    return new NextResponse("Unknown error", {
      status: 500,
      headers,
    });
  }
}
