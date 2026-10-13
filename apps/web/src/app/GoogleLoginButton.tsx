"use client";

import {
  HAS_ACCEPTED_PRIVACY_POLICY,
  PRIVACY_POLICY_URL,
  REDIRECT_TO_AUTHORIZATION_API_URL,
} from "@hangup/shared";
import Link from "./Link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";

type FormValues = {
  acceptedPrivacyPolicy: string;
};

// https://developers.google.com/identity/branding-guidelines
export default function GoogleLoginButton({
  hasAcceptedPrivacyPolicyInSession,
  theme = "light",
}: {
  hasAcceptedPrivacyPolicyInSession: true | false;
  // Google's two compliant treatments — chosen by the surrounding mode
  // (light for dawn/day, dark for dusk/night).
  theme?: "light" | "dark";
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "all",
  });

  useEffect(() => {
    // TODO Is this allowed? What if multiple user use the same browser?
    if (localStorage.getItem("hasAcceptedPrivacyPolicy") === "true") {
      setValue("acceptedPrivacyPolicy", "true");
    }
  }, []);

  return (
    <>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(() => {
          localStorage.setItem(HAS_ACCEPTED_PRIVACY_POLICY, "true");
          window.location.href = REDIRECT_TO_AUTHORIZATION_API_URL;
        })}
      >
        <button
          type="submit"
          className={clsx("gsi-material-button", {
            "gsi-material-button-dark": theme === "dark",
          })}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: "block" }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">
              Sign in with Google
            </span>
            <span style={{ display: "none" }}>Sign in with Google</span>
          </div>
        </button>
        {/* We hide instead of remove the DOM node in order to not break hydration */}
        <div
          className={clsx(
            hasAcceptedPrivacyPolicyInSession ? "hidden" : "mt-4 flex flex-col",
          )}
        >
          <label
            className={clsx(
              "flex items-center space-x-2 text-sm",
              theme === "dark" ? "text-gray-200" : "text-gray-600",
            )}
          >
            <input
              {...register("acceptedPrivacyPolicy", {
                required: true,
              })}
              className={clsx(
                "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                errors.acceptedPrivacyPolicy &&
                  "outline outline-red-600 outline-2 outline-offset-0",
              )}
              type="checkbox"
              aria-invalid={typeof errors.acceptedPrivacyPolicy !== "undefined"}
              aria-errormessage="acceptedPrivacyPolicy-error"
            />
            <span>
              By clicking Sign In With Google I have read and agree to the{" "}
              <Link href={PRIVACY_POLICY_URL}>privacy policy</Link>
            </span>
          </label>
          {errors.acceptedPrivacyPolicy && (
            <p
              id="acceptedPrivacyPolicy-error"
              role="alert"
              className="text-error text-size text-base mt-1"
            >
              You must accept the privacy policy before continuing
            </p>
          )}
        </div>
      </form>
    </>
  );
}
