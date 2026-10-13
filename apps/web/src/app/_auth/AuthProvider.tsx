"use client";

/* Client-side auth state for the keyless frontend.
 *
 * The frontend (Cloudflare) never touches Firestore/Google directly. It learns
 * who the visitor is by fetching `/api/userinfo` (reverse-proxied to the Cloud
 * Run backend, which owns the session + GCP credentials). Every component that
 * needs auth state reads it from this context instead of a server prop. */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthenticatedUserInfo,
  UnauthenticatedUserInfo,
} from "@hangup/shared";

export type LandingUserInfo =
  | (AuthenticatedUserInfo & { missingScopes: string[] })
  | UnauthenticatedUserInfo;

const UNAUTHENTICATED: LandingUserInfo = {
  authenticated: false,
  hasAcceptedPrivacyPolicy: false,
};

type AuthState = {
  /** Resolved user info, or `null` while the first fetch is in flight. */
  userInfo: LandingUserInfo | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  userInfo: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userInfo: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/userinfo", { credentials: "same-origin" })
      .then((res) =>
        res.ok ? (res.json() as Promise<LandingUserInfo>) : UNAUTHENTICATED,
      )
      .catch(() => UNAUTHENTICATED)
      .then((userInfo) => {
        if (!cancelled) {
          setState({ userInfo, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Auth state with `null`/loading collapsed to "unauthenticated" for rendering. */
export function useUserInfo(): { userInfo: LandingUserInfo; loading: boolean } {
  const { userInfo, loading } = useAuth();
  return { userInfo: userInfo ?? UNAUTHENTICATED, loading };
}
