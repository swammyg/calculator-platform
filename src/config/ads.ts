import type { Site } from "./domains";

export type AdPlacement = "leaderboard" | "sidebar" | "results";
export const ADSENSE_MODE = import.meta.env.VITE_ADSENSE_MODE === "production" ? "production" : "test";

/** Configure these for the unified Kalko platform. */
export const ADS: Record<Site, { client: string; slots: Record<AdPlacement, string>; audience: string }> = {
  unified: { 
    client: import.meta.env.VITE_ADSENSE_UNIFIED_CLIENT ?? "", 
    slots: { 
      leaderboard: import.meta.env.VITE_ADSENSE_UNIFIED_LEADERBOARD ?? "", 
      sidebar: import.meta.env.VITE_ADSENSE_UNIFIED_SIDEBAR ?? "", 
      results: import.meta.env.VITE_ADSENSE_UNIFIED_RESULTS ?? "" 
    }, 
    audience: "Finance, health, and content analysis" 
  }
};

/** One GA4 Web stream / Measurement ID used by every first-party domain. */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "";
