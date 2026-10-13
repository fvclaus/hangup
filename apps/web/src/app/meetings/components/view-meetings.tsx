"use client";

import { MeetingAndCode, START_MEETING_PATH } from "@hangup/shared";
import { Title } from "@/components/ui/title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus } from "lucide-react";
import Link from "@/app/Link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewMeetings({
  meetings,
}: {
  meetings: MeetingAndCode[];
}) {
  const [meetingsView, setMeetingsView] =
    useState<(MeetingAndCode & { formattedScheduledEndTime?: string })[]>(
      meetings,
    );

  // TODO Add start date and status
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setMeetingsView(
      meetings.map((meeting) => ({
        ...meeting,
        formattedScheduledEndTime: formatter.format(
          new Date(meeting.scheduledEndTime),
        ),
      })),
    );
  }, [meetings]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Title title="My Meetings" />
      <div className="w-full bg-blue-50 py-16 text-gray-600 flex flex-col items-center">
        <div className="px-4 max-w-screen-lg w-full flex flex-col bg-white rounded-2xl shadow-xl p-8">
          <Link
            href={START_MEETING_PATH}
            role="button"
            variant="button"
            className="ml-auto"
          >
            <Plus className="inline mr-2 h-5 w-5" />
            Create New Meeting
          </Link>
          <section className="w-full ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xl font-semibold text-gray-900">
                    Scheduled End Time
                  </TableHead>
                  <TableHead className="text-xl font-semibold text-gray-900">
                    Meeting Code
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No meetings created yet
                    </TableCell>
                  </TableRow>
                )}
                {meetings.length > 0 &&
                  meetingsView.map((meeting) => (
                    <TableRow key={meeting.meetingCode}>
                      <TableCell className="font-medium">
                        {meeting.formattedScheduledEndTime ? (
                          <span className="text-base">
                            {meeting.formattedScheduledEndTime}
                          </span>
                        ) : (
                          <Skeleton className="h-4 w-[100px]" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={meeting.uri}
                          target="_blank"
                          className="text-base"
                        >
                          {meeting.meetingCode}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </div>
    </div>
  );
}
