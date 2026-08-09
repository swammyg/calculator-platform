import { GA_MEASUREMENT_ID } from "../config/ads";
import type { Site } from "../config/domains";
import type { JsonValue } from "../types";

type EventParameters = Record<string, string | number | boolean | undefined>;
const domainName: Record<Site, "calculator" | "time-tools" | "seo-tools"> = { calculators: "calculator", time: "time-tools", seo: "seo-tools" };

export function initialiseGA4(): void {
  if (!GA_MEASUREMENT_ID || document.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`)) return;
  const script = document.createElement("script"); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`; script.dataset.gaId = GA_MEASUREMENT_ID; document.head.appendChild(script);
  window.dataLayer = window.dataLayer ?? []; window.gtag = (...args: unknown[]) => window.dataLayer!.push(args); window.gtag("js", new Date()); window.gtag("config", GA_MEASUREMENT_ID, { linker: { domains: ["www.kalko.uk", "time.kalko.uk", "seo.kalko.uk"] }, send_page_view: true });
}

export function track(eventName: string, parameters: EventParameters): void { if (GA_MEASUREMENT_ID && window.gtag) window.gtag("event", eventName, parameters); }
function summary(result: Record<string, JsonValue>): string { return Object.keys(result).slice(0, 3).join(","); }

export function trackCalculatorUsed(name: string, result: Record<string, JsonValue>): void { track("calculator_used", { calculator_name: name, result_summary: summary(result), domain_name: domainName.calculators }); }
export function trackToolUsed(site: Exclude<Site, "calculators">, name: string, result: Record<string, JsonValue>): void { track("tool_used", { tool_name: name, tool_category: domainName[site], result_summary: summary(result), domain_name: domainName[site] }); }
export function trackAdImpression(site: Site, slot: string): void { track("ad_impression", { domain_name: domainName[site], ad_slot: slot }); }
export function trackAdClick(site: Site, slot: string): void { track("ad_click", { domain_name: domainName[site], ad_slot: slot }); }
export function trackAffiliateClick(site: Site, partner: string): void { track("affiliate_click", { domain_name: domainName[site], partner }); }
