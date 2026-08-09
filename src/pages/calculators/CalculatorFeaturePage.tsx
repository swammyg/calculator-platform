import type { ReactNode } from "react";
import { AdUnit } from "../../components/shared/AdUnit";
import { Breadcrumbs } from "../../components/shared/Breadcrumbs";

export function CalculatorFeaturePage({ title, description, disclaimer, children }: { title: string; description: string; disclaimer: string; children: ReactNode }): JSX.Element {
  return <article><Breadcrumbs items={[{ name: "Home", href: "https://www.kalko.uk/" }, { name: "Calculators", href: "https://www.kalko.uk/" }, { name: title }]} /><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{description}</p><div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0">{children}<AdUnit site="calculators" placement="results" /></div><aside className="hidden xl:block"><AdUnit site="calculators" placement="sidebar" /></aside></div><aside aria-label="Important disclaimer" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong>Important:</strong> {disclaimer}</aside></article>;
}
