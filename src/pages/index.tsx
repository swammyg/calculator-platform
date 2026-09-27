import { useEffect, useState } from "react";
import { Layout } from "../components/shared/Layout";
import { resolveSite } from "../config/domains";
import { UnifiedToolsPage } from "./UnifiedToolsPage";

function hashSlug(): string | undefined { 
  const value = window.location.hash.replace(/^#\/?/, ""); 
  return value || undefined; 
}

export function DomainRouter(): JSX.Element { 
  const site = resolveSite(); 
  const [slug, setSlug] = useState(hashSlug); 
  
  useEffect(() => { 
    const update = () => setSlug(hashSlug()); 
    window.addEventListener("hashchange", update); 
    return () => window.removeEventListener("hashchange", update); 
  }, []); 
  
  return <Layout site={site}><UnifiedToolsPage slug={slug} /></Layout>; 
}
