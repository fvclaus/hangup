import { cookies } from "next/headers";
import { SITE_BASE, createOauth2Client, db } from "../shared/server_constants";
import { SESSION_ID_NAME } from "@hangup/shared";
import { Logger } from "@/log";

const logger = new Logger("session");

type SessionId = string;

async function getSessionId(): Promise<SessionId | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_ID_NAME)?.value;
}

async function setSessionId(sessionId: SessionId): Promise<void> {
  const cookieStore = await cookies();
  if (SITE_BASE.startsWith("https://")) {
    cookieStore.set(SESSION_ID_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  } else {
    cookieStore.set(SESSION_ID_NAME, sessionId, { path: "/", httpOnly: true });
  }
}

export type NewSession = {
  hasAcceptedPrivacyPolicy: false;
};

export type DuringAuthorizationSession = {
  hasAcceptedPrivacyPolicy: true;
  state: string;
};

export type Credentials = {
  refresh_token: string;
  expiry_date: number;
  access_token: string;
  token_type: string;
  id_token: string;
  scope: string;
};

export type AuthorizedSession = {
  hasAcceptedPrivacyPolicy: true;
  credentials: Credentials;
  userId: string;
  picture: string;
  name: string;
};

export type SessionData =
  | NewSession
  | DuringAuthorizationSession
  | AuthorizedSession;

export function isAuthorizedSession(
  sessionData: SessionData | undefined,
): sessionData is AuthorizedSession {
  return sessionData !== undefined && "credentials" in sessionData;
}

async function createNewSession(
  sessionId: string,
  data: NewSession,
): Promise<void> {
  await db.collection("session").doc(sessionId).set(data);
  logger.debug(`Session ${sessionId} created`, { sessionId });
}

async function _set(sessionId: string, data: SessionData): Promise<void> {
  await db.collection("session").doc(sessionId).set(data);
}

async function getSessionIdAndCreateIfMissing(): Promise<string> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    const newSessionId = crypto.randomUUID();
    await setSessionId(newSessionId);
    await createNewSession(newSessionId, {
      hasAcceptedPrivacyPolicy: false,
    });
    return newSessionId;
  }

  return sessionId;
}

export async function getSession(): Promise<SessionData | undefined> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return undefined;
  }
  const doc = await db.collection("session").doc(sessionId).get(),
    data = doc.data() as SessionData | undefined;
  if (!data) {
    return undefined;
  }
  return data;
}

export async function setSession(session: SessionData): Promise<void> {
  const sessionId = await getSessionIdAndCreateIfMissing();
  await _set(sessionId, session);
}

export async function deleteSession(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) {
    try {
      await db.collection("session").doc(sessionId).delete();
    } catch (e) {
      logger.error(e, { sessionId });
    }
    logger.debug(`Session ${sessionId} deleted`, { sessionId });
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_ID_NAME);
  }
}

export function getCredentials(credentials: Credentials) {
  const oauth2Client = createOauth2Client();
  oauth2Client.setCredentials(credentials);
  return oauth2Client;
}
