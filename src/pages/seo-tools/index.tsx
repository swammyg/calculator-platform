import type { ToolDefinition } from "../../types";
import { KeywordDensityPage } from "./KeywordDensityPage";
import { ReadabilityScorePage } from "./ReadabilityScorePage";
import { WordCounterPage } from "./WordCounterPage";

const sample = "Write at least ten words here to analyse readability, keyword frequency, and search-friendly content quality.";
const seoTools: readonly ToolDefinition[] = [
  { slug: "word-counter", title: "Word Counter", description: "Count words, characters, paragraphs, reading time, and term frequency.", endpoint: "/api/v1/tools/seo/word-counter", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }] },
  { slug: "readability-score", title: "Readability Score", description: "Get six readability metrics and practical UK-focused writing guidance.", endpoint: "/api/v1/tools/seo/readability-score", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }] },
  { slug: "keyword-density", title: "Keyword Density", description: "Analyse stemmed keyword frequency and natural focus-keyword usage.", endpoint: "/api/v1/tools/seo/keyword-density", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }, { name: "focus_keyword", label: "Focus keyword (optional)", type: "text", defaultValue: "content quality" }] }
];

export function SeoToolsPage({ slug }: { slug?: string }): JSX.Element { const pages: Record<string, JSX.Element> = { "word-counter": <WordCounterPage />, "readability-score": <ReadabilityScorePage />, "keyword-density": <KeywordDensityPage /> }; if (slug && pages[slug]) return pages[slug]; return <section><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">seo.kalko.uk</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Better content, one check at a time.</h1><div className="mt-8 grid gap-4 sm:grid-cols-3">{seoTools.map((tool) => <a key={tool.slug} href={`#/${tool.slug}`} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">{tool.title}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tool.description}</p></a>)}</div></section>; }
