import { useEffect, type ReactNode } from "react";
import { initialiseGA4 } from "../../analytics/ga4";
import { DOMAIN_CONFIG, type Site } from "../../config/domains";
import { useAppStore } from "../../store/useAppStore";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ToolNavigation } from "./ToolNavigation";
import { AdUnit } from "./AdUnit";

function useAnalytics(site: Site): void { useEffect(() => { initialiseGA4(); }, [site]); }

export function Layout({ site, children }: { site: Site; children: ReactNode }): JSX.Element { const { darkMode, toggleDarkMode } = useAppStore(); const config = DOMAIN_CONFIG[site]; useAnalytics(site); useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); document.title = `${config.title} | Calculator Tools`; }, [config.title, darkMode]); return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded focus:bg-white focus:p-3 focus:text-slate-900">Skip to content</a><Header site={site} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} /><main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><AdUnit site={site} placement="leaderboard" /><details className="mb-6 lg:hidden"><summary className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">Browse calculators and tools</summary><div className="mt-3"><ToolNavigation mobile /></div></details><div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]"><aside className="hidden lg:block"><ToolNavigation /></aside><div className="min-w-0">{children}</div></div></main><Footer /></div>; }
