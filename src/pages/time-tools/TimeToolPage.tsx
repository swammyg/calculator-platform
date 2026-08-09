import type { ReactNode } from "react";
import { AdUnit } from "../../components/shared/AdUnit";
import { Breadcrumbs } from "../../components/shared/Breadcrumbs";

export function TimeToolPage({ title, description, children }: { title: string; description: string; children: ReactNode }): JSX.Element { return <article><Breadcrumbs items={[{ name: "Home", href: "https://www.kalko.uk/" }, { name: "Time Tools", href: "https://time.kalko.uk/" }, { name: title }]} /><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{description}</p><div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0">{children}<AdUnit site="time" placement="results" /></div><aside className="hidden xl:block"><AdUnit site="time" placement="sidebar" /></aside></div></article>; }
