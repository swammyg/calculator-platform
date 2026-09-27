export type Site = "unified";

export const DOMAIN_CONFIG: Record<Site, { hostnames: readonly string[]; title: string; tagline: string }> = {
  unified: { 
    hostnames: [
      "www.kalko.uk", "kalko.uk", 
      "time.kalko.uk", "seo.kalko.uk",
      "calculator.app", "www.calculator.app", 
      "time.calculator.app", "seo.calculator.app",
      "time.localhost", "seo.localhost",
      "localhost", "127.0.0.1"
    ], 
    title: "Kalko", 
    tagline: "All your calculations and content tools in one place." 
  }
};

export function resolveSite(hostname = window.location.hostname): Site {
  return "unified";
}
