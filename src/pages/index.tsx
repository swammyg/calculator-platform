import { useEffect, useState } from "react";
import { Layout } from "../components/shared/Layout";
import { resolveSite } from "../config/domains";
import { CalculatorsPage } from "./calculators";
import { SeoToolsPage } from "./seo-tools";
import { TimeToolsPage } from "./time-tools";

function hashSlug(): string | undefined { const value = window.location.hash.replace(/^#\/?/, ""); return value || undefined; }
export function DomainRouter(): JSX.Element { const site = resolveSite(); const [slug, setSlug] = useState(hashSlug); useEffect(() => { const update = () => setSlug(hashSlug()); window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []); const page = site === "calculators" ? <CalculatorsPage slug={slug} /> : site === "time" ? <TimeToolsPage slug={slug} /> : <SeoToolsPage slug={slug} />; return <Layout site={site}>{page}</Layout>; }
