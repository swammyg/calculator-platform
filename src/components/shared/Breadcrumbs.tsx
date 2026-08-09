type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }): JSX.Element {
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, ...(item.href ? { item: item.href } : {}) })) };
  return <><nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600 dark:text-slate-300"><ol className="flex flex-wrap items-center gap-2">{items.map((item, index) => <li key={`${item.name}-${index}`} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <a href={item.href} className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-300">{item.name}</a> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></>;
}
