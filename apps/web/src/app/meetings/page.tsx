"use client";

import { useEffect, useState } from "react";
import type { MeetingAndCode } from "@hangup/shared";
import ViewMeetings from "./components/view-meetings";
import { useRequireAuth } from "@/app/_auth/useRequireAuth";
import { PageLoading } from "@/app/_auth/PageLoading";

export default function Page() {
  const { loading, userInfo } = useRequireAuth();
  const [meetings, setMeetings] = useState<MeetingAndCode[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (userInfo) {
      void fetch("/api/meetings", { credentials: "same-origin" })
        .then((res) =>
          res.ok ? (res.json() as Promise<MeetingAndCode[]>) : [],
        )
        .catch(() => [] as MeetingAndCode[])
        .then((data) => {
          if (!cancelled) {
            setMeetings(data);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [userInfo]);

  if (loading || meetings === null) {
    return <PageLoading />;
  }

  return <ViewMeetings meetings={meetings} />;
}
