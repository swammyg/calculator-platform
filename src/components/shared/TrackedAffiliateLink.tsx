import { trackAffiliateClick } from "../../analytics/ga4";
import type { Site } from "../../config/domains";
import type { ReactNode } from "react";

export function TrackedAffiliateLink({ site, partner, href, children }: { site: Site; partner: string; href: string; children: ReactNode }): JSX.Element {
  return <a href={href} rel="sponsored noopener noreferrer" target="_blank" onClick={() => trackAffiliateClick(site, partner)}>{children}</a>;
}
