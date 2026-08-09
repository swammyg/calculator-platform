import { useEffect, useRef, useState } from "react";
import { trackAdClick, trackAdImpression } from "../../analytics/ga4";
import { ADS, ADSENSE_MODE, type AdPlacement } from "../../config/ads";
import { resolveSite, type Site } from "../../config/domains";

const formats: Record<AdPlacement, "horizontal" | "rectangle" | "auto"> = { leaderboard: "horizontal", sidebar: "rectangle", results: "auto" };

export function AdUnit({ site = resolveSite(), placement = "results", slot }: { site?: Site; placement?: AdPlacement; slot?: string }): JSX.Element | null {
  const config = ADS[site]; const adSlot = slot ?? config.slots[placement]; const ref = useRef<HTMLModElement>(null); const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (ADSENSE_MODE !== "production" || !config.client || !adSlot) return;
    const selector = `script[data-adsense-client="${config.client}"]`; let script = document.querySelector<HTMLScriptElement>(selector);
    if (!script) { script = document.createElement("script"); script.async = true; script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.client)}`; script.crossOrigin = "anonymous"; script.dataset.adsenseClient = config.client; script.onerror = () => setUnavailable(true); document.head.appendChild(script); }
    if (ref.current) { try { (window.adsbygoogle = window.adsbygoogle ?? []).push({}); trackAdImpression(site, adSlot); } catch { setUnavailable(true); } }
  }, [adSlot, config.client, site]);
  if (ADSENSE_MODE === "test") return <aside aria-label="Advertisement preview" className={`my-6 grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 ${placement === "leaderboard" ? "min-h-24" : placement === "sidebar" ? "min-h-[250px]" : "min-h-28"}`}>Ad preview · {config.audience} · {placement}</aside>;
  if (!config.client || !adSlot || unavailable) return null;
  return <aside aria-label="Advertisement" onClick={() => trackAdClick(site, adSlot)} className={`my-6 overflow-hidden rounded-lg ${placement === "sidebar" ? "min-h-[250px]" : "min-h-24"}`}><ins ref={ref} className="adsbygoogle block" data-ad-client={config.client} data-ad-slot={adSlot} data-ad-format={formats[placement]} data-full-width-responsive={placement === "results" ? "true" : undefined} /></aside>;
}
