"use client";

/* Client-side route guard. The old server pages used `redirect("/")` against the
 * Firestore session; the keyless frontend can't read the session server-side, so
 * authenticated routes guard on the client instead. Returns the resolved user
 * once authorized; redirects to "/" otherwise. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type LandingUserInfo } from "./AuthProvider";

type RequireAuthResult = {
  loading: boolean;
  /** The resolved user once authorized (authenticated + all required scopes),
   * otherwise null. Consumers use it as a "ready" gate. */
  userInfo: LandingUserInfo | null;
};

export function useRequireAuth(): RequireAuthResult {
  const { userInfo, loading } = useAuth();
  const router = useRouter();

  const authorized =
    userInfo !== null &&
    userInfo.authenticated &&
    userInfo.missingScopes.length === 0;

  useEffect(() => {
    if (!loading && !authorized) {
      router.replace("/");
    }
  }, [loading, authorized, router]);

  return {
    loading: loading || !authorized,
    userInfo: authorized ? userInfo : null,
  };
}
