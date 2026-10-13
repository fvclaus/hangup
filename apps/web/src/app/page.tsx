import { getCloudflareContext } from "@opennextjs/cloudflare";
import { TZDate } from "@date-fns/tz";
import HangUpLanding from "./_landing/HangUpLanding";
import GoogleAdsPageViewTracker from "./GoogleAdsPageViewTracker";
import { GOOGLE_ADS_CONVERSION_LABEL, GOOGLE_ADS_ID } from "@hangup/shared";

// Read the visitor's timezone per request (Cloudflare edge), so the landing
// renders the correct day/night mode on the first paint — no flicker.
export const dynamic = "force-dynamic";

/* Minutes-since-midnight in the visitor's local time.
 *
 * On Cloudflare we read `request.cf.timezone` (resolved at the edge) so the very
 * first server paint is already in the right time-of-day mode. Anywhere else
 * (local `next dev`, `next start`) there is no Cloudflare context, so we fall
 * back to the server's own local time. The client refines this to the browser's
 * real local time on mount (see HangUpLanding). */
async function resolveInitialMinutes(): Promise<number> {
  try {
    const { cf } = await getCloudflareContext<{ timezone?: string }>({
      async: true,
    });
    const timezone = cf?.timezone;
    if (typeof timezone === "string" && timezone.length > 0) {
      const now = new TZDate(Date.now(), timezone);
      const minutes = now.getHours() * 60 + now.getMinutes();
      if (!Number.isNaN(minutes)) {
        return minutes;
      }
    }
  } catch {
    // No Cloudflare context (local dev / Cloud Run) — use server time below.
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default async function Page() {
  const initialMinutes = await resolveInitialMinutes();

  return (
    <>
      <HangUpLanding initialMinutes={initialMinutes} />
      <GoogleAdsPageViewTracker
        googleAdsId={GOOGLE_ADS_ID}
        conversionLabel={GOOGLE_ADS_CONVERSION_LABEL}
      />
    </>
  );
}
