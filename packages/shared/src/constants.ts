import { addMinutes, isAfter } from "date-fns";

export const START_MEETING_PATH = "/meeting/start";
export const MEETING_END_MINUTES_OFFSET = parseInt(
  process.env.NEXT_PUBLIC_MEETING_END_MINUTES_OFFSET || "5",
  10,
);
if (isNaN(MEETING_END_MINUTES_OFFSET)) {
  throw new Error("Missing or invalid MINUTES_OFFSET");
}

export function isMeetingEndAfterOffset(meetingEnd: Date) {
  const earliestEndTime = addMinutes(new Date(), MEETING_END_MINUTES_OFFSET);
  return isAfter(meetingEnd, earliestEndTime);
}
export const MEETINGS_URL = "/meetings";
export const REDIRECT_TO_AUTHORIZATION_API_URL = `/api/redirect-to-authorization`;
export const HAS_ACCEPTED_PRIVACY_POLICY = "hasAcceptedPrivacyPolicy";
export const SETTINGS_URL = "/settings";
export const LOGOUT_URL = "/api/logout";
export const PRIVACY_POLICY_URL = "/privacy-policy";
export const REPORT_ISSUE_URL = "/report-issue";
export const SESSION_ID_NAME = "session-id";
export const GOOGLE_ADS_ID = "AW-17136814715";
export const GOOGLE_ADS_CONVERSION_LABEL = "ZHcWCIGe19AaEPuUvOs_";
export const CONSENT_CATEGORY_ADVERTISEMENT = "advertisement";
export const CONSENT_SERVICE_AD_STORAGE = "ad_storage";
export const CONSENT_SERVICE_AD_USER_DATA = "ad_user_data";
