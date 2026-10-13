"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JoinMeeting, type MeetingData } from "./_components/join-meeting";
import { PageLoading } from "@/app/_auth/PageLoading";
import { useRequireAuth } from "@/app/_auth/useRequireAuth";

export default function Page() {
  const params = useParams<{ meetingCode: string }>();
  const { meetingCode } = params;
  const { loading, userInfo } = useRequireAuth();
  // undefined = loading, null = not found / unauthorized
  const [meeting, setMeeting] = useState<MeetingData | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!userInfo) {
      return undefined;
    }
    let cancelled = false;
    void fetch(`/api/meeting/${meetingCode}`, { credentials: "same-origin" })
      .then((res) =>
        res.ok
          ? (res.json() as Promise<
              Pick<MeetingData, "scheduledEndTime" | "uri">
            >)
          : null,
      )
      .catch(() => null)
      .then((data) => {
        if (!cancelled) {
          setMeeting(data ? { ...data, code: meetingCode } : null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [meetingCode, userInfo]);

  if (loading || meeting === undefined) {
    return <PageLoading />;
  }

  if (meeting === null) {
    return (
      <div className="flex flex-col w-full max-w-screen-sm">
        {/* TODO Replace with alert component */}
        <div role="alert" className="alert alert-error w-full">
          <span>Could not find meeting</span>
        </div>
      </div>
    );
  }

  return <JoinMeeting meeting={meeting}></JoinMeeting>;
}
