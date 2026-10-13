"use client";

import { differenceInSeconds } from "date-fns";
import { useEffect, useState } from "react";
import { Meeting, START_MEETING_PATH } from "@hangup/shared";
import { Calendar, Clock } from "lucide-react";
import FAQSection from "@/app/FAQSection";
import Link from "@/app/Link";
import { cn } from "@/lib/utils";

export type MeetingData = Pick<Meeting, "scheduledEndTime"> &
  Pick<Meeting, "uri"> & { code: string };

export function JoinMeeting({ meeting }: { meeting: MeetingData }) {
  const [endTimeFormatted, setEndTimeFormatted] = useState<string>(
    meeting.scheduledEndTime,
  );

  // Cannot use navigator.language with SSR
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(navigator.language, {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEndTimeFormatted(formatter.format(new Date(meeting.scheduledEndTime)));
  }, [meeting.scheduledEndTime]);

  // TODO Server side rendering causes issue, because the client state is different.
  const [timeRemaining, setTimeRemaining] = useState<number>(
      differenceInSeconds(meeting.scheduledEndTime, new Date()),
    ),
    formatTimeRemaining = (time: number): string => {
      let remaining = time;
      const hours = Math.floor(remaining / (60 * 60));
      remaining -= hours * 60 * 60;
      const minutes = Math.floor(remaining / 60);
      remaining -= minutes * 60;
      const seconds = remaining;
      return [hours, minutes, seconds]
        .map((n) => n.toString().padStart(2, "0"))
        .join(":");
    };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const diff = differenceInSeconds(meeting.scheduledEndTime, new Date());

      if (diff <= 0) {
        setTimeRemaining(0);
        clearInterval(timerInterval);
      } else {
        setTimeRemaining(diff);
      }
    }, 1000);

    // Cleanup the interval when the component unmounts
    return () => {
      clearInterval(timerInterval);
    };
  }, [meeting]);

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl text-center px-4 mb-8 mt-10">
          <div className="flex justify-center space-x-6 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center transition-colors hover:bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center transition-colors hover:bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
            <span className="block text-blue-600">Join Your Meeting</span>
          </h1>
        </div>

        <div className="w-full bg-blue-50 py-16">
          <div className="px-4 flex flex-col items-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <p>
                Meeting with code{" "}
                <span className="font-bold">{meeting.code}</span> created.{" "}
                {timeRemaining > 0 && (
                  <>
                    It will end in{" "}
                    {/* https://legacy.reactjs.org/docs/dom-elements.html#suppresshydrationwarning */}
                    <span className="font-bold" suppressHydrationWarning>
                      {formatTimeRemaining(timeRemaining)} at {endTimeFormatted}
                    </span>
                  </>
                )}
                {timeRemaining === 0 && (
                  <>
                    We tried to end the meeting at{" "}
                    <span className="font-bold" suppressHydrationWarning>
                      {endTimeFormatted}
                    </span>
                    .
                  </>
                )}
              </p>
              <div className="flex flex-col lg:flex-row mt-2">
                <div className="grid flex-grow place-items-center">
                  <Link href={START_MEETING_PATH}>Create another</Link>
                </div>
                <div
                  className={cn("grid flex-grow place-items-center", {
                    invisible: timeRemaining === 0,
                  })}
                >
                  <Link target="_blank" variant="button" href={meeting.uri}>
                    Join now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-4xl text-center px-4">
          <FAQSection />
        </div>
      </div>
    </>
  );
}
