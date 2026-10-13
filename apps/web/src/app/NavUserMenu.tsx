"use client";

import UserMenu from "./UserMenu";
import { useAuth } from "./_auth/AuthProvider";

/* The shared navbar's user menu. Reads auth state from context (the keyless
 * frontend has no server-side session) and renders the avatar menu only once an
 * authenticated user is resolved. */
export default function NavUserMenu() {
  const { userInfo } = useAuth();
  if (userInfo === null || !userInfo.authenticated) {
    return null;
  }
  return <UserMenu userinfo={userInfo} />;
}
