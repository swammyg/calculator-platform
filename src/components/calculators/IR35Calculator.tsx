import { useState } from "react";
import { calculate } from "../../api/client";
import { trackCalculatorUsed } from "../../analytics/ga4";
import { CalculatorForm } from "../shared/CalculatorForm";
import type { FieldDefinition, JsonValue } from "../../types";

type Amounts = Record<string, JsonValue>;
type IR35Result = Amounts & { inside_ir35: Amounts; outside_ir35: Amounts; assumptions: JsonValue[] };
const fields: readonly FieldDefinition[] = [
  { name: "daily_rate_gbp", label: "Daily rate (£)", type: "number", min: 0.01, defaultValue: 500, required: true },
  { name: "contract_duration_months", label: "Contract duration (months)", type: "select", defaultValue: "12", options: ["3", "6", "12"], required: true },
  { name: "days_worked_per_year", label: "Days worked per year", type: "number", min: 1, max: 366, defaultValue: 220, required: true },
  { name: "car_miles_per_year", label: "Annual car miles (optional)", type: "number", min: 0, defaultValue: 0 },
  { name: "accountant_fees_per_year_gbp", label: "Accountant fees (£/year)", type: "number", min: 0, defaultValue: 800 },
  { name: "software_equipment_costs_per_year_gbp", label: "Annual software/equipment costs (£)", type: "number", min: 0, defaultValue: 1200 }
];
const currency = (value: JsonValue | undefined): string => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(typeof value === "number" ? value : 0);
const label = (key: string): string => key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const insideKeys = ["annual_gross_income", "employer_national_insurance", "pension_contribution", "accountant_fees", "software_equipment_costs", "taxable_income", "income_tax", "employee_national_insurance", "mileage_benefit", "annual_net_take_home", "monthly_net_take_home", "contract_net_take_home"] as const;
const outsideKeys = ["annual_gross_revenue", "accountant_fees", "software_equipment_costs", "mileage_business_expense", "taxable_profit", "corporation_tax", "profit_after_corporation_tax", "salary", "dividends_before_tax", "dividend_tax", "mileage_benefit", "annual_net_take_home", "monthly_net_take_home", "contract_net_take_home"] as const;

function Breakdown({ title, values, keys, theme }: { title: string; values: Amounts; keys: readonly string[]; theme: "inside" | "outside" }): JSX.Element {
  const colour = theme === "inside" ? "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30";
  return <section className={`rounded-xl border p-5 ${colour}`}><h2 className="text-lg font-bold">{title}</h2><dl className="mt-4 space-y-2 text-sm">{keys.map((key) => <div key={key} className={`flex items-center justify-between gap-4 ${key.includes("net_take_home") ? "border-t border-current pt-2 font-bold" : ""}`}><dt>{label(key)}{key === "mileage_benefit" && <span className="ml-1 text-xs font-normal">(tax-free)</span>}</dt><dd>{currency(values[key])}</dd></div>)}</dl></section>;
}

export function IR35Calculator(): JSX.Element {
  const [result, setResult] = useState<IR35Result | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(values: Record<string, JsonValue>): Promise<void> { setLoading(true); setError(""); try { const response = await calculate<IR35Result>("/api/v1/calculators/ir35", values); setResult(response.result); trackCalculatorUsed("ir35", response.result); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not calculate this comparison. Please check the values entered."); } finally { setLoading(false); } }
  return <div className="grid gap-6"><CalculatorForm formFields={fields} onSubmit={submit} loading={loading} error={error} submitLabel="Compare IR35 options" />{result && <section aria-live="polite" className="grid gap-5"><div className={`rounded-xl border p-5 ${Number(result.annual_difference_outside_minus_inside) >= 0 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30"}`}><p className="text-sm font-semibold uppercase tracking-wide">Estimated better outcome</p><h2 className="mt-1 text-2xl font-bold">{String(result.recommended_structure)}</h2><p className="mt-2">Outside minus inside: <strong>{currency(result.annual_difference_outside_minus_inside)} annually</strong> ({currency(result.monthly_difference_outside_minus_inside)} monthly).</p></div><div className="grid gap-5 lg:grid-cols-2"><Breakdown title="Inside IR35 (employee-like)" values={result.inside_ir35} keys={insideKeys} theme="inside" /><Breakdown title="Outside IR35 (limited company)" values={result.outside_ir35} keys={outsideKeys} theme="outside" /></div><details className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><summary className="cursor-pointer font-semibold">Assumptions and important notes</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">{result.assumptions.map((assumption) => <li key={String(assumption)}>{String(assumption)}</li>)}</ul></details></section>}</div>;
}
