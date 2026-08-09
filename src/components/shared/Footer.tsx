export function Footer(): JSX.Element {
  return <footer className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800"><p>Results are informational estimates. © {new Date().getFullYear()} Calculator Tools.</p><nav aria-label="Footer navigation" className="mt-3 flex justify-center gap-4"><a href="#privacy" className="hover:text-indigo-600">Privacy</a><a href="#terms" className="hover:text-indigo-600">Terms</a><a href="#contact" className="hover:text-indigo-600">Contact</a></nav></footer>;
}
