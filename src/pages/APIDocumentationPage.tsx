import { useState } from "react";

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  category: string;
  requestExample: object;
  responseExample: object;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/calculators/uk-salary-tax",
    summary: "UK salary tax estimate (2024/25 bands)",
    description: "Calculate UK income tax, National Insurance, pension contributions, and student loan deductions for the 2024/25 tax year.",
    category: "Finance",
    requestExample: { annual_salary_gbp: 60000, bonus_gbp: 5000, pension_contribution_pct: 5, is_scotland: false, student_loan: false },
    responseExample: { annual_gross_salary: 65000, income_tax: 11900, employee_national_insurance: 4748, employer_national_insurance: 7695, student_loan_repayment: 0, total_deductions: 16648, annual_take_home: 48352, monthly_take_home: 4029.33, effective_tax_rate_pct: 25.61 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/uk-mortgage",
    summary: "UK repayment mortgage and SDLT estimate",
    description: "Calculate monthly mortgage payments, stamp duty land tax (SDLT), council tax, insurance, and total housing costs.",
    category: "Finance",
    requestExample: { property_price_gbp: 350000, deposit_gbp: 70000, interest_rate_percent: 4.5, term_years: 25, property_tax_annual_gbp: 1800, insurance_annual_gbp: 300, maintenance_reserve_pct: 1 },
    responseExample: { property_price: 350000, deposit: 70000, loan_amount: 280000, stamp_duty_land_tax: 12500, monthly_mortgage_payment: 1414.5, monthly_council_tax: 150, monthly_insurance: 25, monthly_maintenance_reserve: 292, total_monthly_payment: 1881.5, total_interest_over_term: 145560, total_cost: 565560 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/uk-pension",
    summary: "UK pension projection",
    description: "Project pension pot growth and estimate retirement income based on contributions, growth rate, and life expectancy.",
    category: "Personal",
    requestExample: { current_age: 35, retirement_age: 67, current_salary_gbp: 55000, current_pension_pot_gbp: 40000, annual_contribution_gbp: 4000, employer_contribution_pct: 5, annual_growth_rate_pct: 5, life_expectancy: 90 },
    responseExample: { current_pension_pot: 40000, years_to_retirement: 32, annual_contribution: 8750, projected_pension_pot_at_retirement: 1250000, tax_free_lump_sum_25pct: 312500, taxable_pension_pot: 937500, annual_withdrawal_4pct: 37500, monthly_pension_income: 3125, state_pension_monthly_estimate: 800, total_monthly_retirement_income: 3925, years_in_retirement: 23 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/uk-personal-finance",
    summary: "UK personal finance and savings plan",
    description: "Calculate monthly surplus and track progress toward savings goals.",
    category: "Personal",
    requestExample: { monthly_income_gbp: 4000, essential_expenses_gbp: 1800, discretionary_spending_gbp: 600, savings_goal_gbp: 30000 },
    responseExample: { monthly_income: 4000, total_expenses: 2400, monthly_surplus: 1600, savings_goal: 30000, months_to_goal: 18.75, annual_savings_rate_pct: 48 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/b2b-roi",
    summary: "B2B investment ROI and NPV",
    description: "Evaluate project returns, break-even point, and five-year net present value.",
    category: "Finance",
    requestExample: { project_investment_gbp: 10000, annual_revenue_increase_gbp: 9000, cost_savings_annual_gbp: 3000, payback_period_months: 12, maintenance_cost_annual_gbp: 500, discount_rate_pct: 10 },
    responseExample: { total_investment: 10000, annual_benefit: 11500, payback_period_months: 10.4, roi_year_one_pct: 115, five_year_npv: 35500, irr_pct: 87.3 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/uk-healthcare-cost",
    summary: "Indicative UK private versus NHS healthcare costs",
    description: "Compare private and NHS treatment costs including time-off-work impact.",
    category: "Health",
    requestExample: { procedure_type: "cataract_surgery_private", private_insurance: false, recovery_weeks: 4, time_off_work_weeks: 2, weekly_income_gbp: 800, referral_needed: false },
    responseExample: { procedure_type: "cataract_surgery_private", nhs_cost: 0, private_cost: 3500, total_lost_income: 1600, total_private_cost: 5100, insurance_covers: 0, patient_cost: 5100 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/bmi",
    summary: "Body mass index",
    description: "Calculate BMI and health category from height and weight.",
    category: "Health",
    requestExample: { weight_kg: 75, height_cm: 180, age: 35, gender: "male" },
    responseExample: { weight_kg: 75, height_cm: 180, bmi: 23.15, category: "normal weight", age_group: "adult" }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/bmr-tdee",
    summary: "Basal metabolic rate and daily energy needs",
    description: "Estimate BMR (calories at rest) and TDEE (total daily energy expenditure) based on activity level.",
    category: "Health",
    requestExample: { weight_kg: 75, height_cm: 180, age: 35, gender: "male", activity_level: "moderate" },
    responseExample: { bmr_kcal: 1750, tdee_kcal: 2625, activity_multiplier: 1.5 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/body-fat",
    summary: "U.S. Navy body-fat estimate",
    description: "Estimate body fat percentage using the U.S. Navy circumference method.",
    category: "Health",
    requestExample: { weight_kg: 75, height_cm: 180, age: 35, gender: "male", neck_cm: 38, waist_cm: 84, hip_cm: 0 },
    responseExample: { weight_kg: 75, body_fat_pct: 18.5, lean_body_mass_kg: 61.2, body_fat_mass_kg: 13.8 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/loan",
    summary: "Fixed-rate loan repayment",
    description: "Calculate monthly payments and total interest for a fixed-rate loan.",
    category: "Finance",
    requestExample: { principal_usd: 10000, annual_rate_percent: 5, term_months: 36 },
    responseExample: { principal: 10000, annual_rate: 5, monthly_payment: 299.71, total_paid: 10789.56, total_interest: 789.56 }
  },
  {
    method: "POST",
    path: "/api/v1/calculators/currency-converter",
    summary: "Indicative currency conversion",
    description: "Convert between major currencies using bundled exchange rates.",
    category: "Finance",
    requestExample: { amount: 1000, from_currency: "GBP", to_currency: "USD" },
    responseExample: { amount: 1000, from_currency: "GBP", to_currency: "USD", rate: 1.28, converted_amount: 1280 }
  },
  {
    method: "POST",
    path: "/api/v1/tools/time/timezone-converter",
    summary: "Convert time between IANA timezones",
    description: "Convert a specific instant to multiple timezones and return current times for 200 IANA timezones.",
    category: "Time Tools",
    requestExample: { iso8601_instant: "2024-01-15T12:00:00Z", reference_timezone: "Europe/London" },
    responseExample: { reference_time: "2024-01-15T12:00:00Z", reference_timezone: "Europe/London", timezones: [{ timezone: "America/New_York", time: "2024-01-15T07:00:00" }, { timezone: "Asia/Tokyo", time: "2024-01-15T21:00:00" }] }
  },
  {
    method: "POST",
    path: "/api/v1/tools/time/age-calculator",
    summary: "Calculate age and birthday countdown",
    description: "Calculate age from ISO 8601 birth date, zodiac sign, and days until next birthday.",
    category: "Time Tools",
    requestExample: { birth_date_iso8601: "1990-05-15" },
    responseExample: { birth_date: "1990-05-15", current_date: "2024-01-15", age_years: 33, age_months: 7, age_days: 31, zodiac_sign: "Taurus", days_until_birthday: 119 }
  },
  {
    method: "POST",
    path: "/api/v1/tools/time/countdown-timer",
    summary: "Calculate event countdown",
    description: "Return human-readable time remaining until a future event.",
    category: "Time Tools",
    requestExample: { target_date_iso8601: "2024-12-25T00:00:00Z" },
    responseExample: { target_date: "2024-12-25T00:00:00Z", days_remaining: 344, hours_remaining: 8, minutes_remaining: 45, human_readable: "344 days, 8 hours, 45 minutes" }
  },
  {
    method: "POST",
    path: "/api/v1/tools/seo/word-counter",
    summary: "Count words, characters, and term frequency",
    description: "Analyze text for word count, character count, and return case-insensitive frequency map.",
    category: "SEO Tools",
    requestExample: { text: "The quick brown fox jumps over the lazy dog. The dog was very lazy." },
    responseExample: { word_count: 13, character_count: 71, unique_words: 11, frequency: { the: 2, quick: 1, brown: 1, fox: 1, jumps: 1, over: 1, lazy: 2, dog: 2 } }
  },
  {
    method: "POST",
    path: "/api/v1/tools/seo/readability-score",
    summary: "Calculate textstat readability scores",
    description: "Return six readability metrics (Flesch, Gunning Fog, etc.) and UK education level.",
    category: "SEO Tools",
    requestExample: { text: "The quick brown fox jumps over the lazy dog." },
    responseExample: { flesch_kincaid_grade: 3.5, flesch_reading_ease: 82.5, gunning_fog: 4.2, coleman_liau_index: 3.1, automated_readability_index: 2.8, dale_chall_readability: 7.1, uk_education_level: "Primary" }
  },
  {
    method: "POST",
    path: "/api/v1/tools/seo/keyword-density",
    summary: "Analyse stemmed keyword frequency and density",
    description: "Filter stop words and return stemmed top keywords with density percentages.",
    category: "SEO Tools",
    requestExample: { text: "Machine learning algorithms help computers learn from data. Learning from data improves machine performance.", focus_keyword: "machine learning" },
    responseExample: { total_words: 12, focus_keyword: "machine learning", focus_keyword_count: 2, focus_keyword_density_pct: 16.7, top_keywords: [{ keyword: "learn", count: 2, density_pct: 16.7 }, { keyword: "data", count: 2, density_pct: 16.7 }] }
  }
];

const categories = ["All", "Finance", "Personal", "Health", "Time Tools", "SEO Tools"];

function CodeBlock({ code, label }: { code: object; label: string }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(code, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <button onClick={handleCopy} className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto text-xs text-slate-300">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}

export function APIDocumentationPage(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const filteredEndpoints = selectedCategory === "All" ? endpoints : endpoints.filter((e) => e.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-4xl">{'</>'}</span>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">API Documentation</h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Comprehensive REST API reference for all Calculator.app endpoints. All endpoints use JSON for request/response payloads.
          </p>
          <div className="mt-4 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">
              <strong>Base URL:</strong> <code className="font-mono">https://api.kalko.uk</code>
            </p>
            <p className="mt-2 text-sm text-indigo-900 dark:text-indigo-200">
              <strong>Authentication:</strong> None required for public endpoints. Rate limited to 120 requests per minute per IP.
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint) => {
            const key = `${endpoint.method}-${endpoint.path}`;
            const isExpanded = expandedEndpoint === key;

            return (
              <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                  className="w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${endpoint.method === "POST" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
                          {endpoint.method}
                        </span>
                        <code className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{endpoint.path}</code>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{endpoint.summary}</p>
                    </div>
                    <div className="ml-4 text-slate-400">
                      <span className={`transition ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">Description</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{endpoint.description}</p>
                      </div>

                      <div>
                        <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">Category</h4>
                        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{endpoint.category}</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <CodeBlock code={endpoint.requestExample} label="Request Example" />
                        <CodeBlock code={endpoint.responseExample} label="Response Example" />
                      </div>

                      <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                        <p className="text-xs text-amber-900 dark:text-amber-200">
                          <strong>Note:</strong> All responses include <code className="font-mono">result</code>, <code className="font-mono">metadata</code> (timestamp, request ID), and <code className="font-mono">cached</code> (boolean) fields.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Response Format</h3>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">All endpoints return a consistent JSON structure:</p>
          <CodeBlock
            code={{
              result: { /* endpoint-specific result */ },
              metadata: { timestamp: "2024-01-15T12:00:00Z", id: "uuid-string", disclaimer: "Optional disclaimer" },
              cached: false
            }}
            label="Response Envelope"
          />
        </div>
      </div>
    </div>
  );
}
