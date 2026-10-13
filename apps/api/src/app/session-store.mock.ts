import { vi } from "vitest";
import {
  AuthorizedSession,
  Credentials,
  getSession,
  isAuthorizedSession,
  NewSession,
} from "./session-store";

export const authenticatedSession: AuthorizedSession = {
  credentials: {} as Credentials,
  hasAcceptedPrivacyPolicy: true,
  name: "myName",
  userId: "myUserId",
  picture: "myPicture",
};

export function mockAuthenticatedSession(
  // TODO Authorized vs Authenticated
  partialSessionData?: Partial<AuthorizedSession>,
) {
  vi.mocked(getSession).mockResolvedValue({
    ...authenticatedSession,
    ...partialSessionData,
  });
  vi.mocked(isAuthorizedSession).mockImplementation(
    (sessionData) => sessionData !== undefined && "credentials" in sessionData,
  );
}
export function mockUnauthorizedSession() {
  const unauthorizedSession: NewSession = {
    hasAcceptedPrivacyPolicy: false,
  };
  vi.mocked(getSession).mockResolvedValue(unauthorizedSession);
}
