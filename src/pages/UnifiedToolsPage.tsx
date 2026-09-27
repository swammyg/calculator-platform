import type { ToolDefinition } from "../types";
import { B2BROIPage } from "./calculators/B2BROIPage";
import { BMIPage } from "./calculators/BMIPage";
import { BMRTDEEPage } from "./calculators/BMRTDEEPage";
import { BodyFatPage } from "./calculators/BodyFatPage";
import { CurrencyConverterPage } from "./calculators/CurrencyConverterPage";
import { LoanPage } from "./calculators/LoanPage";
import { UKHealthcareCostPage } from "./calculators/UKHealthcareCostPage";
import { UKMortgagePage } from "./calculators/UKMortgagePage";
import { UKPensionPage } from "./calculators/UKPensionPage";
import { UKPersonalFinancePage } from "./calculators/UKPersonalFinancePage";
import { UKSalaryTaxPage } from "./calculators/UKSalaryTaxPage";
import { IR35Page } from "./calculators/IR35Page";
import { AgeCalculatorPage } from "./time-tools/AgeCalculatorPage";
import { TimeZoneConverterPage } from "./time-tools/TimeZoneConverterPage";
import { CountdownTimerPage } from "./time-tools/CountdownTimerPage";
import { KeywordDensityPage } from "./seo-tools/KeywordDensityPage";
import { ReadabilityScorePage } from "./seo-tools/ReadabilityScorePage";
import { WordCounterPage } from "./seo-tools/WordCounterPage";

const commonMoney = (name: string, label: string, defaultValue = 0) => ({ name, label, type: "number" as const, min: 0, defaultValue, required: true });

const calculators: readonly ToolDefinition[] = [
  { slug: "uk-salary-tax", title: "UK Salary & Tax", description: "Estimate 2024/25 UK tax, National Insurance, pension, and student-loan deductions.", endpoint: "/api/v1/calculators/uk-salary-tax", fields: [commonMoney("annual_salary_gbp", "Annual salary (£)", 50000), commonMoney("bonus_gbp", "Bonus (£)"), { name: "pension_contribution_pct", label: "Pension contribution (%)", type: "number", min: 0, max: 100, defaultValue: 0 }, { name: "is_scotland", label: "Scottish income-tax bands", type: "checkbox" }, { name: "student_loan", label: "Student Loan Plan 2", type: "checkbox" }] },
  { slug: "uk-mortgage", title: "UK Mortgage", description: "Compare repayment costs, stamp duty, and monthly housing expenses.", endpoint: "/api/v1/calculators/uk-mortgage", fields: [commonMoney("property_price_gbp", "Property price (£)", 350000), commonMoney("deposit_gbp", "Deposit (£)", 70000), { name: "interest_rate_percent", label: "Interest rate (%)", type: "number", min: 0, defaultValue: 4.5 }, { name: "term_years", label: "Term (years)", type: "number", min: 1, max: 50, defaultValue: 25 }, commonMoney("property_tax_annual_gbp", "Annual council tax (£)", 1800), commonMoney("insurance_annual_gbp", "Annual insurance (£)", 300), { name: "maintenance_reserve_pct", label: "Maintenance reserve (%)", type: "number", min: 0, defaultValue: 1 }] },
  { slug: "uk-pension", title: "UK Pension", description: "Project your pot and estimated retirement income.", endpoint: "/api/v1/calculators/uk-pension", fields: [{ name: "current_age", label: "Current age", type: "number", min: 16, defaultValue: 35 }, { name: "retirement_age", label: "Retirement age", type: "number", min: 17, defaultValue: 67 }, commonMoney("current_salary_gbp", "Current salary (£)", 55000), commonMoney("current_pension_pot_gbp", "Current pension pot (£)", 40000), commonMoney("annual_contribution_gbp", "Annual contribution (£)", 4000), { name: "employer_contribution_pct", label: "Employer contribution (%)", type: "number", min: 0, defaultValue: 5 }, { name: "annual_growth_rate_pct", label: "Growth rate (%)", type: "number", defaultValue: 5 }, { name: "life_expectancy", label: "Life expectancy", type: "number", min: 18, defaultValue: 90 }] },
  { slug: "uk-personal-finance", title: "Personal Finance", description: "See your monthly surplus and path to a savings goal.", endpoint: "/api/v1/calculators/uk-personal-finance", fields: [commonMoney("monthly_income_gbp", "Monthly income (£)", 4000), commonMoney("essential_expenses_gbp", "Essential expenses (£)", 1800), commonMoney("discretionary_spending_gbp", "Discretionary spending (£)", 600), commonMoney("savings_goal_gbp", "Savings goal (£)", 30000)] },
  { slug: "b2b-roi", title: "B2B ROI", description: "Plan a direct business case or a lead-to-revenue marketing forecast.", endpoint: "/api/v1/calculators/b2b-roi", fields: [] },
  { slug: "uk-healthcare-cost", title: "UK Healthcare Cost", description: "Compare indicative private and NHS treatment costs.", endpoint: "/api/v1/calculators/uk-healthcare-cost", fields: [{ name: "procedure_type", label: "Procedure", type: "select", defaultValue: "cataract_surgery_private", options: ["gp_consultation_private", "dermatology_private", "physiotherapy_private", "dental_checkup_private", "dental_filling_private", "cataract_surgery_private", "hip_replacement_private", "knee_replacement_private", "hernia_repair_private"] }, { name: "private_insurance", label: "Private insurance", type: "checkbox" }, { name: "recovery_weeks", label: "Recovery weeks", type: "number", min: 0, defaultValue: 4 }, { name: "time_off_work_weeks", label: "Time off work (weeks)", type: "number", min: 0, defaultValue: 2 }, commonMoney("weekly_income_gbp", "Weekly income (£)", 800), { name: "referral_needed", label: "Referral needed", type: "checkbox" }] },
  { slug: "bmi", title: "BMI", description: "Calculate body mass index from height and weight.", endpoint: "/api/v1/calculators/bmi", fields: [{ name: "weight_kg", label: "Weight (kg)", type: "number", min: 1, defaultValue: 70 }, { name: "height_cm", label: "Height (cm)", type: "number", min: 1, defaultValue: 175 }, { name: "age", label: "Age", type: "number", min: 2, defaultValue: 30 }, { name: "gender", label: "Gender", type: "select", defaultValue: "male", options: ["male", "female", "other"] }] },
  { slug: "bmr-tdee", title: "BMR & TDEE", description: "Estimate your basal metabolic rate and daily energy needs.", endpoint: "/api/v1/calculators/bmr-tdee", fields: [{ name: "weight_kg", label: "Weight (kg)", type: "number", min: 1, defaultValue: 70 }, { name: "height_cm", label: "Height (cm)", type: "number", min: 1, defaultValue: 175 }, { name: "age", label: "Age", type: "number", min: 2, defaultValue: 30 }, { name: "gender", label: "Gender", type: "select", defaultValue: "male", options: ["male", "female"] }, { name: "activity_level", label: "Activity", type: "select", defaultValue: "moderate", options: ["sedentary", "light", "moderate", "active", "very_active"] }] },
  { slug: "body-fat", title: "Body Fat", description: "Estimate body fat with the U.S. Navy circumference method.", endpoint: "/api/v1/calculators/body-fat", fields: [{ name: "weight_kg", label: "Weight (kg)", type: "number", min: 1, defaultValue: 70 }, { name: "height_cm", label: "Height (cm)", type: "number", min: 1, defaultValue: 175 }, { name: "age", label: "Age", type: "number", min: 2, defaultValue: 30 }, { name: "gender", label: "Gender", type: "select", defaultValue: "male", options: ["male", "female"] }, { name: "neck_cm", label: "Neck (cm)", type: "number", min: 1, defaultValue: 38 }, { name: "waist_cm", label: "Waist (cm)", type: "number", min: 1, defaultValue: 84 }, { name: "hip_cm", label: "Hip (cm, required for female)", type: "number", min: 0, defaultValue: 0 }] },
  { slug: "loan", title: "Loan", description: "Calculate a fixed-rate USD loan repayment.", endpoint: "/api/v1/calculators/loan", fields: [{ name: "principal_usd", label: "Loan amount (USD)", type: "number", min: 1, defaultValue: 10000 }, { name: "annual_rate_percent", label: "Annual rate (%)", type: "number", min: 0, defaultValue: 5 }, { name: "term_months", label: "Term (months)", type: "number", min: 1, defaultValue: 36 }] },
  { slug: "currency-converter", title: "Currency Converter", description: "Convert currencies using indicative bundled exchange rates.", endpoint: "/api/v1/calculators/currency-converter", fields: [{ name: "amount", label: "Amount", type: "number", min: 0, defaultValue: 100 }, { name: "from_currency", label: "From", type: "select", defaultValue: "GBP", options: ["GBP", "USD", "EUR", "CAD", "AUD", "JPY", "CHF"] }, { name: "to_currency", label: "To", type: "select", defaultValue: "USD", options: ["GBP", "USD", "EUR", "CAD", "AUD", "JPY", "CHF"] }] },
  { slug: "ir35", title: "IR35 Inside vs Outside", description: "Compare simplified contractor take-home inside and outside IR35.", endpoint: "/api/v1/calculators/ir35", fields: [] }
];

const sample = "Write at least ten words here to analyse readability, keyword frequency, and search-friendly content quality.";
const timeTools: readonly ToolDefinition[] = [
  { slug: "timezone-converter", title: "Timezone Converter", description: "Compare an instant across IANA timezones and see 200 current global times.", endpoint: "/api/v1/tools/time/timezone-converter", fields: [{ name: "source_timezone", label: "Source timezone", type: "text", defaultValue: "America/New_York", required: true }, { name: "target_timezone", label: "Target timezone", type: "text", defaultValue: "Europe/London", required: true }, { name: "date_time", label: "Date and time", type: "datetime-local", defaultValue: "2026-08-07T14:30", required: true }] },
  { slug: "age-calculator", title: "Age Calculator", description: "Calculate your exact calendar age, zodiac sign, and next birthday.", endpoint: "/api/v1/tools/time/age-calculator", fields: [{ name: "birthdate", label: "Birth date", type: "date", defaultValue: "1990-05-15", required: true }] },
  { slug: "countdown-timer", title: "Countdown Timer", description: "Create a human-readable countdown to an important event.", endpoint: "/api/v1/tools/time/countdown-timer", fields: [{ name: "target_date", label: "Target date", type: "datetime-local", defaultValue: "2030-01-01T00:00", required: true }, { name: "event_name", label: "Event name", type: "text", defaultValue: "New Year" }, { name: "timezone", label: "Timezone", type: "text", defaultValue: "Europe/London", required: true }, { name: "start_date", label: "Start date (optional, for progress)", type: "datetime-local" }] }
];

const seoTools: readonly ToolDefinition[] = [
  { slug: "word-counter", title: "Word Counter", description: "Count words, characters, paragraphs, reading time, and term frequency.", endpoint: "/api/v1/tools/seo/word-counter", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }] },
  { slug: "readability-score", title: "Readability Score", description: "Get six readability metrics and practical UK-focused writing guidance.", endpoint: "/api/v1/tools/seo/readability-score", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }] },
  { slug: "keyword-density", title: "Keyword Density", description: "Analyse stemmed keyword frequency and natural focus-keyword usage.", endpoint: "/api/v1/tools/seo/keyword-density", fields: [{ name: "text", label: "Text to analyse", type: "textarea", defaultValue: sample, required: true }, { name: "focus_keyword", label: "Focus keyword (optional)", type: "text", defaultValue: "content quality" }] }
];

const allTools = [...calculators, ...timeTools, ...seoTools];

const toolCategories = [
  { title: "Personal Finance", description: "Everyday decisions, borrowing, savings and retirement planning.", slugs: ["uk-personal-finance", "uk-pension", "loan", "currency-converter"] },
  { title: "Finance", description: "Income, home ownership and business investment decisions.", slugs: ["uk-salary-tax", "uk-mortgage", "b2b-roi", "ir35"] },
  { title: "Health", description: "Body measurements, energy needs and healthcare costs.", slugs: ["uk-healthcare-cost", "bmi", "bmr-tdee", "body-fat"] },
  { title: "Time Tools", description: "Convert timezones, calculate your age, and count down to events.", slugs: ["timezone-converter", "age-calculator", "countdown-timer"] },
  { title: "Content & SEO", description: "Analyse text readability, word count, and keyword frequency.", slugs: ["word-counter", "readability-score", "keyword-density"] }
] as const;

export function UnifiedToolsPage({ slug }: { slug?: string }): JSX.Element {
  const pages: Record<string, JSX.Element> = {
    "uk-salary-tax": <UKSalaryTaxPage />,
    "uk-mortgage": <UKMortgagePage />,
    "uk-pension": <UKPensionPage />,
    "uk-personal-finance": <UKPersonalFinancePage />,
    "b2b-roi": <B2BROIPage />,
    ir35: <IR35Page />,
    "uk-healthcare-cost": <UKHealthcareCostPage />,
    bmi: <BMIPage />,
    "bmr-tdee": <BMRTDEEPage />,
    "body-fat": <BodyFatPage />,
    loan: <LoanPage />,
    "currency-converter": <CurrencyConverterPage />,
    "timezone-converter": <TimeZoneConverterPage />,
    "age-calculator": <AgeCalculatorPage />,
    "countdown-timer": <CountdownTimerPage />,
    "word-counter": <WordCounterPage />,
    "readability-score": <ReadabilityScorePage />,
    "keyword-density": <KeywordDensityPage />
  };

  if (slug && pages[slug as keyof typeof pages]) return pages[slug as keyof typeof pages];

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">kalko.uk</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Clear answers for every decision.</h1>
      <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Calculators, time tools, and content analysis in one place. Built around transparent assumptions.</p>
      <div className="mt-10 grid gap-10">
        {toolCategories.map((category) => (
          <section key={category.title} aria-labelledby={`${category.title.toLowerCase()}-tools`}>
            <div className="mb-4">
              <h2 id={`${category.title.toLowerCase()}-tools`} className="text-2xl font-bold tracking-tight">{category.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.slugs.map((slug) => {
                const tool = allTools.find((item) => item.slug === slug);
                return tool ? (
                  <a
                    key={tool.slug}
                    href={`#/${tool.slug}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <h3 className="font-semibold">{tool.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tool.description}</p>
                  </a>
                ) : null;
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
