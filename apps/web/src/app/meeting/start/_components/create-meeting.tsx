"use client";

import { useForm } from "react-hook-form";
import { addDays, formatISO, set } from "date-fns";
import { useState } from "react";
import { TZDate } from "@date-fns/tz";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import FAQSection from "@/app/FAQSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  isMeetingEndAfterOffset,
  MEETING_END_MINUTES_OFFSET,
} from "@hangup/shared";
import { Title } from "@/components/ui/title";

type FormValues = {
  endTime: string;
};

export default function CreateMeeting() {
  const [error, setError] = useState<string | undefined>(),
    router = useRouter(),
    // TODO default mode doesn't work. Why?
    { register, handleSubmit, formState } = useForm<FormValues>({
      mode: "all",
    }),
    { errors, isValid, isSubmitting } = formState;

  // TODO Server using up lots of RAM

  async function createMeeting(data: FormValues) {
    setError(undefined);
    const response = await fetch(`/api/meeting/`, {
      method: "POST",
      body: JSON.stringify({ scheduledEndTime: formatISO(data.endTime) }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      setError(await response.text());
      return false;
    }
    setError(undefined);

    const meeting = (await response.json()) as { meetingCode: string };

    router.push(`/meeting/${meeting.meetingCode}`);

    return false;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center mb-10">
        <Title title="Start a meeting" />

        <div className="w-full bg-blue-50 py-16">
          <div className="px-4 flex flex-col items-center">
            <form
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSubmit={handleSubmit(createMeeting)}
              className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
            >
              {error && (
                <Alert>
                  <AlertTitle>Problem while creating meeting</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <label htmlFor="endTime" className="form-control w-full ">
                <div className="label">
                  <span className="label-text text-blue-700">
                    When should the meeting end?
                  </span>
                </div>

                <input
                  type="time"
                  id="endTime"
                  className={clsx(
                    "input input-bordered w-full",
                    errors.endTime && "input-error",
                  )}
                  {...register("endTime", {
                    required: true,
                    setValueAs(value: string | undefined) {
                      if (value === undefined) {
                        return value;
                      }
                      const [hours, minutes] = value
                        .split(":")
                        .map((s) => parseInt(s, 10));
                      let endTime = set(new Date(), {
                        hours,
                        minutes,
                        seconds: 0,
                        milliseconds: 0,
                      });
                      if (!isMeetingEndAfterOffset(endTime)) {
                        endTime = addDays(endTime, 1);
                      }
                      return endTime;
                    },
                    validate: {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      wrongTime: ((v: TZDate) => {
                        return (
                          isMeetingEndAfterOffset(v) ||
                          `Meeting must be at least ${MEETING_END_MINUTES_OFFSET} minutes long.`
                        );
                        // TODO Wrong typing?
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      }) as any,
                    },
                  })}
                />
              </label>
              {errors.endTime && (
                <p className="text-error text-size text-base mt-1">
                  {errors.endTime.message}
                </p>
              )}
              {/* TODO CTA button */}
              <button
                className="btn w-full mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                {!isSubmitting && <span>Create Meeting</span>}
                {isSubmitting && (
                  <span className="loading loading-spinner"></span>
                )}
              </button>
            </form>
          </div>
        </div>
        <div className="w-full max-w-4xl text-center mt-16">
          <FAQSection />
        </div>
      </div>
    </>
  );
}
