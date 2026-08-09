export type Site = "calculators" | "time" | "seo";

export const DOMAIN_CONFIG: Record<Site, { hostnames: readonly string[]; title: string; tagline: string }> = {
  calculators: { hostnames: ["www.kalko.uk", "kalko.uk", "calculator.app", "www.calculator.app", "localhost", "127.0.0.1"], title: "Calculator", tagline: "Clear answers for everyday decisions." },
  time: { hostnames: ["time.kalko.uk", "time.calculator.app", "time.localhost"], title: "Time Tools", tagline: "Every moment, in the right place." },
  seo: { hostnames: ["seo.kalko.uk", "seo.calculator.app", "seo.localhost"], title: "SEO Tools", tagline: "Make every word work harder." }
};

export function resolveSite(hostname = window.location.hostname): Site {
  return (Object.entries(DOMAIN_CONFIG).find(([, config]) => config.hostnames.includes(hostname))?.[0] as Site | undefined) ?? "calculators";
}
