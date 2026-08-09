import type { Site } from "./domains";

export type AdPlacement = "leaderboard" | "sidebar" | "results";
export const ADSENSE_MODE = import.meta.env.VITE_ADSENSE_MODE === "production" ? "production" : "test";

/** Configure these independently in each domain deployment. Slot selection—not client code—keeps inventory domain-specific. */
export const ADS: Record<Site, { client: string; slots: Record<AdPlacement, string>; audience: string }> = {
  calculators: { client: import.meta.env.VITE_ADSENSE_CALCULATORS_CLIENT ?? "", slots: { leaderboard: import.meta.env.VITE_ADSENSE_CALCULATORS_LEADERBOARD ?? "", sidebar: import.meta.env.VITE_ADSENSE_CALCULATORS_SIDEBAR ?? "", results: import.meta.env.VITE_ADSENSE_CALCULATORS_RESULTS ?? "" }, audience: "Finance and business" },
  time: { client: import.meta.env.VITE_ADSENSE_TIME_CLIENT ?? "", slots: { leaderboard: import.meta.env.VITE_ADSENSE_TIME_LEADERBOARD ?? "", sidebar: import.meta.env.VITE_ADSENSE_TIME_SIDEBAR ?? "", results: import.meta.env.VITE_ADSENSE_TIME_RESULTS ?? "" }, audience: "Travel and student" },
  seo: { client: import.meta.env.VITE_ADSENSE_SEO_CLIENT ?? "", slots: { leaderboard: import.meta.env.VITE_ADSENSE_SEO_LEADERBOARD ?? "", sidebar: import.meta.env.VITE_ADSENSE_SEO_SIDEBAR ?? "", results: import.meta.env.VITE_ADSENSE_SEO_RESULTS ?? "" }, audience: "Writing and marketing" }
};

/** One GA4 Web stream / Measurement ID used by every first-party domain. */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "";
