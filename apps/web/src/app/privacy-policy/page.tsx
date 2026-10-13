import { Title } from "@/components/ui/title";
import "./style.css";
import Link from "../Link";
import { SESSION_ID_NAME, MEETINGS_URL, SETTINGS_URL } from "@hangup/shared";
import { Shield } from "lucide-react";
import React from "react";
import { ShowCookiePreferencesLink } from "@/components/CookieConsentBanner";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Title
        title="Privacy Policy"
        subtitle="Information on data collection, usage, and protection practices"
        icons={[Shield]}
      />
      <div className="w-full bg-blue-50 py-16 text-gray-600">
        <article
          id="privacy-policy"
          className="mx-auto rounded-lg w-full max-w-screen-lg bg-white rounded-2xl shadow-xl p-8"
        >
          <p>
            This website is a hobby project to learn some new technologies. It
            is developed and provided by me as an individual:
          </p>
          <p>Frederik Claus, f.v.claus@googlemail.com</p>
          <section>
            <h2>What data is collected?</h2>
            <ul>
              <li>
                <p>
                  Personal identification information provided by Google login
                  including first- and last name, profile picture and unique
                  user id
                </p>
              </li>
              <li>
                <p>
                  Data about Google Meet conferences started through this
                  website. Including the meeting code and the scheduled end
                  time.
                </p>
              </li>
              <li>
                <p>
                  Log Data that include your IP address, device information,
                  browser type, and settings. This information is not connected
                  with your account
                </p>
              </li>
              <li>
                <p>
                  Only if you have{" "}
                  <ShowCookiePreferencesLink>
                    consented
                  </ShowCookiePreferencesLink>{" "}
                  to it: Google Ads Data include pages viewed and interactions
                  on these pages, you IP address (which can be used to infer
                  your general geographic location), Information about your
                  device and browser type.
                </p>
              </li>
            </ul>
          </section>

          <section>
            <h2>When is your data collected?</h2>
            <ul>
              <li>
                <p>
                  When you use the "Sign in with Google" social media login.
                </p>
              </li>
              <li>
                <p>
                  When you interact with the website in general and specifically
                  when you create conferences
                </p>
              </li>
            </ul>
          </section>
          <section>
            <h2>How is your data used?</h2>
            <p>
              Your data is used create and manage meetings on your behalf. The
              log data is used to identify problems with the website.
            </p>
            <p>
              Data collected via Google Ads is used to measure the performance
              of advertising campaigns and understand how users engage with the
              website.
            </p>
          </section>

          <section>
            <h2>How and where is your data stored?</h2>
            <p>
              The data is stored in a Google Firestore in the eur3 region which
              includes data centers in Belgium and the Netherlands. See the{" "}
              <Link
                target="_blank"
                href="https://firebase.google.com/docs/firestore/locations"
              >
                official documentation
              </Link>{" "}
              for more details. Google Cloud Firestore encrypts data both{" "}
              <Link
                href="https://firebase.google.com/support/privacy#data_encryption"
                target="_blank"
              >
                in transit and at rest
              </Link>
              . The data is kept until you{" "}
              <Link href={SETTINGS_URL}>delete</Link> your account.
            </p>
          </section>
          <section>
            <h2>Is my data transferred or disclosed to third parties?</h2>
            <p>
              If you have{" "}
              <ShowCookiePreferencesLink>consented</ShowCookiePreferencesLink>{" "}
              to it, for the purpose of website analytics and advertising
              campaign tracking, Google Ads is utilized. Data is shared with
              Google to enable these services. Google processes this data in
              accordance with its own privacy policies. You can review it at{" "}
              <Link target="_blank" href="https://policies.google.com/privacy">
                Google's Privacy Policy
              </Link>{" "}
              and use{" "}
              <Link
                target="_blank"
                href="https://adssettings.google.com/authenticated"
              >
                Google Ad Settings
              </Link>{" "}
              to manage your ad preferences with Google.
            </p>
          </section>
          <section>
            <h2>How can I access/rectify/erase/restrict my data?</h2>
            <p>
              You can <Link href={MEETINGS_URL}>access</Link> and{" "}
              <Link href={SETTINGS_URL}>delete</Link> your data at any time.
            </p>
          </section>
          <section>
            <h2>What cookies are used?</h2>
            <ul>
              <li>
                <p>
                  A session cookie called "{SESSION_ID_NAME}" is used to
                  authenticate you as a user.
                </p>
              </li>
              <li>
                <p>
                  If you have{" "}
                  <ShowCookiePreferencesLink>
                    consented
                  </ShowCookiePreferencesLink>{" "}
                  to it, Google Ads may place cookies on your browser.
                </p>
              </li>
            </ul>
          </section>
          <section>
            <h2>Changes to the privacy policy</h2>
            <p>
              The privacy policy is kept under regular review. This privacy
              policy was last updated on 21 June 2025.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
