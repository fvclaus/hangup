"use client";

import { Settings } from "./components/settings";
import { useRequireAuth } from "@/app/_auth/useRequireAuth";
import { PageLoading } from "@/app/_auth/PageLoading";

export default function Page() {
  const { loading } = useRequireAuth();

  if (loading) {
    return <PageLoading />;
  }

  return <Settings />;
}
