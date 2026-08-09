import { FormEvent, useMemo, useState } from "react";
import { FormFields, initialFormValues } from "./FormFields";
import type { FieldDefinition, JsonValue } from "../../types";

export interface CalculatorFormProps { formFields: readonly FieldDefinition[]; onSubmit: (values: Record<string, JsonValue>) => Promise<void> | void; loading?: boolean; error?: string; submitLabel?: string; }

export function CalculatorForm({ formFields, onSubmit, loading = false, error, submitLabel = "Calculate" }: CalculatorFormProps): JSX.Element {
  const defaults = useMemo(() => initialFormValues(formFields), [formFields]); const [values, setValues] = useState<Record<string, JsonValue>>(defaults);
  function submit(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); void onSubmit(values); }
  return <form onSubmit={submit} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><FormFields fields={formFields} values={values} onChange={(name, value) => setValues((previous) => ({ ...previous, [name]: value }))} /><button disabled={loading} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Calculating…" : submitLabel}</button>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}</form>;
}
