"use client";

import CreateMeeting from "./_components/create-meeting";
import { useRequireAuth } from "@/app/_auth/useRequireAuth";
import { PageLoading } from "@/app/_auth/PageLoading";

/**
 * @see {@link https://developers.google.com/meet/add-ons/guides/overview#side-panel}
 */
export default function Page() {
  const { loading } = useRequireAuth();

  if (loading) {
    return <PageLoading />;
  }

  return <CreateMeeting />;
}
