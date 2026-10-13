"use client";

import { useEffect } from "react";

interface GoogleAdsPageViewTrackerProps {
  googleAdsId: string;
  conversionLabel: string;
}

const GoogleAdsPageViewTracker: React.FC<GoogleAdsPageViewTrackerProps> = ({
  googleAdsId,
  conversionLabel,
}) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.gtag("event", "conversion", {
        send_to: `${googleAdsId}/${conversionLabel}`,
        value: 0.005,
        currency: "EUR",
      });
    }
  }, []);

  return null;
};

export default GoogleAdsPageViewTracker;
