type NavigationLink = { label: string; href: string };
type NavigationGroup = { label: string; links: readonly NavigationLink[] };

const groups: readonly NavigationGroup[] = [
  { label: "Personal Calculators", links: [{ label: "Personal Finance Calculator", href: "https://www.kalko.uk/#/personal-finance" }, { label: "UK Pension Calculator", href: "https://www.kalko.uk/#/uk-pension" }, { label: "Loan Calculator", href: "https://www.kalko.uk/#/loan" }, { label: "Currency Converter", href: "https://www.kalko.uk/#/currency-converter" }] },
  { label: "Finance Calculators", links: [{ label: "UK Salary Tax Calculator", href: "https://www.kalko.uk/#/uk-salary-tax" }, { label: "UK Mortgage Calculator", href: "https://www.kalko.uk/#/uk-mortgage" }, { label: "B2B ROI Calculator", href: "https://www.kalko.uk/#/b2b-roi" }, { label: "IR35 Inside vs Outside Calculator", href: "https://www.kalko.uk/#/ir35" }] },
  { label: "Health Calculators", links: [{ label: "BMI Calculator", href: "https://www.kalko.uk/#/bmi" }, { label: "BMR & TDEE Calculator", href: "https://www.kalko.uk/#/bmr-tdee" }, { label: "Body Fat Calculator", href: "https://www.kalko.uk/#/body-fat" }, { label: "UK Healthcare Cost Calculator", href: "https://www.kalko.uk/#/healthcare-cost" }] },
  { label: "Time Tools", links: [{ label: "Time Zone Converter", href: "https://time.kalko.uk/#/timezone-converter" }, { label: "Age Calculator", href: "https://time.kalko.uk/#/age-calculator" }, { label: "Countdown Timer", href: "https://time.kalko.uk/#/countdown-timer" }] },
  { label: "SEO Tools", links: [{ label: "Word Counter", href: "https://seo.kalko.uk/#/word-counter" }, { label: "Readability Score Calculator", href: "https://seo.kalko.uk/#/readability-score" }, { label: "Keyword Density Checker", href: "https://seo.kalko.uk/#/keyword-density" }] }
];

export function ToolNavigation({ mobile = false }: { mobile?: boolean }): JSX.Element {
  return <nav role="navigation" aria-label="Calculator and tool navigation" className={mobile ? "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" : "sticky top-6"}>
    {groups.map((group) => <section key={group.label} className="mb-6 last:mb-0" aria-labelledby={`navigation-${group.label.replaceAll(" ", "-").toLowerCase()}`}>
      <h2 id={`navigation-${group.label.replaceAll(" ", "-").toLowerCase()}`} className="border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:text-slate-400">{group.label}</h2>
      <ul className="mt-2 space-y-1">
        {group.links.map((link) => <li key={link.href}><a href={link.href} className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300">{link.label}</a></li>)}
      </ul>
    </section>)}
  </nav>;
}
