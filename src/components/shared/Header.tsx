import type { Site } from "../../config/domains";

const logos: Record<Site, string> = { unified: "Kalko" };

export function Header({ site, darkMode, onToggleDarkMode }: { site: Site; darkMode: boolean; onToggleDarkMode: () => void }): JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#/" className="font-bold tracking-tight" aria-label={`${logos[site]} tools home`}>
          ◈ <span className="text-indigo-600 dark:text-indigo-400">{logos[site]}</span>
        </a>
        <nav role="navigation" aria-label="Main menu" className="hidden gap-5 text-sm text-slate-600 dark:text-slate-300 sm:flex">
          <a href="#/" className="hover:text-indigo-600">All tools</a>
          <a href="/docs" className="hover:text-indigo-600">API documentation</a>
        </nav>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          aria-label="Toggle colour theme"
          aria-pressed={darkMode}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
