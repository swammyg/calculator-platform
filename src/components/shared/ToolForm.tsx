import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FormFields, initialFormValues } from "./FormFields";
import type { FieldDefinition, JsonValue } from "../../types";

export interface ToolFormProps { formFields: readonly FieldDefinition[]; onSubmit: (values: Record<string, JsonValue>) => Promise<void> | void; realtime?: boolean; loading?: boolean; error?: string; }

export function ToolForm({ formFields, onSubmit, realtime = false, loading = false, error }: ToolFormProps): JSX.Element {
  const defaults = useMemo(() => initialFormValues(formFields), [formFields]); const [values, setValues] = useState<Record<string, JsonValue>>(defaults); const firstChange = useRef(true);
  useEffect(() => { if (!realtime || firstChange.current) { firstChange.current = false; return; } const timer = window.setTimeout(() => { void onSubmit(values); }, 450); return () => window.clearTimeout(timer); }, [onSubmit, realtime, values]);
  function submit(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); void onSubmit(values); }
  return <form onSubmit={submit} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><FormFields fields={formFields} values={values} onChange={(name, value) => setValues((previous) => ({ ...previous, [name]: value }))} /><button disabled={loading} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Working…" : "Run tool"}</button>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}</form>;
}
