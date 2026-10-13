"use client";

import { useEffect } from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import {
  CONSENT_CATEGORY_ADVERTISEMENT,
  CONSENT_SERVICE_AD_STORAGE,
  CONSENT_SERVICE_AD_USER_DATA,
} from "@hangup/shared";
import { linkVariants } from "@/app/Link";
import { cn } from "@/lib/utils";

function updateGtagConsent() {
  if (typeof window.gtag !== "function") {
    return;
  }

  // https://cookieconsent.orestbida.com/advanced/google-consent-mode.html
  // https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced
  // https://support.google.com/tagmanager/answer/10718549
  window.gtag("consent", "update", {
    [CONSENT_SERVICE_AD_STORAGE]: CookieConsent.acceptedService(
      CONSENT_SERVICE_AD_STORAGE,
      CONSENT_CATEGORY_ADVERTISEMENT,
    )
      ? "granted"
      : "denied",
    [CONSENT_SERVICE_AD_USER_DATA]: CookieConsent.acceptedService(
      CONSENT_SERVICE_AD_USER_DATA,
      CONSENT_CATEGORY_ADVERTISEMENT,
    )
      ? "granted"
      : "denied",
  });
}

const DESCRIPTION =
  "We use a session cookie for authentication and Google Ad cookies to measure the effectiveness of advertising campaigns. You can accept or reject the ad cookies. You can manage your preferences in the footer";
const CookieConsentBanner: React.FC = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    CookieConsent.run({
      revision: 1,

      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        [CONSENT_CATEGORY_ADVERTISEMENT]: {
          services: {
            [CONSENT_SERVICE_AD_STORAGE]: {
              label:
                "Enables storage (such as cookies) related to advertising.",
            },
            [CONSENT_SERVICE_AD_USER_DATA]: {
              label:
                "Sets consent for sending user data related to advertising to Google.",
            },
          },
        },
      },

      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "We use cookies",
              description: DESCRIPTION,
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Manage Cookie Preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save preferences",
              sections: [
                {
                  title: "Your Choices",
                  description: DESCRIPTION,
                },
                {
                  title: "Strictly Necessary Cookies",
                  description:
                    "These cookies are essential for the website to function, such as keeping you logged in. They cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Advertising",
                  description:
                    "Google uses cookies for advertising for measuring the effectiveness of ads.",
                  linkedCategory: CONSENT_CATEGORY_ADVERTISEMENT,
                },
                {
                  title: "More Information",
                  description:
                    'For more details, please see our <a class="cc-link" href="/privacy-policy">Privacy Policy</a>.',
                },
              ],
            },
          },
        },
      },
      onFirstConsent: updateGtagConsent,
      onConsent: updateGtagConsent,
      onChange: updateGtagConsent,
    });
  }, []);
  return null;
};

interface ShowCookieConsentLinkProps {
  children: React.ReactNode;
}

const ShowCookiePreferencesLink: React.FC<ShowCookieConsentLinkProps> = ({
  children,
}) => {
  return (
    <button
      className={cn(linkVariants({ variant: "default" }))}
      type="button"
      onClick={() => {
        CookieConsent.showPreferences();
      }}
    >
      {children}
    </button>
  );
};

export { ShowCookiePreferencesLink };

export default CookieConsentBanner;
