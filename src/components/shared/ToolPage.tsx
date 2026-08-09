import { useCallback, useState } from "react";
import { calculate } from "../../api/client";
import type { ApiEnvelope, JsonValue, ToolDefinition } from "../../types";
import { CalculatorForm } from "./CalculatorForm";
import { ResultsDisplay } from "./ResultsDisplay";
import { ToolForm } from "./ToolForm";

export function ToolPage({ definition, toolMode = false }: { definition: ToolDefinition; toolMode?: boolean }): JSX.Element {
  const [result, setResult] = useState<ApiEnvelope<Record<string, JsonValue>> | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = useCallback(async (values: Record<string, JsonValue>): Promise<void> => { setLoading(true); setError(""); setResult(null); try { setResult(await calculate(definition.endpoint, values)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong."); } finally { setLoading(false); } }, [definition.endpoint]);
  const form = toolMode ? <ToolForm formFields={definition.fields} onSubmit={submit} loading={loading} error={error} /> : <CalculatorForm formFields={definition.fields} onSubmit={submit} loading={loading} error={error} />;
  return <article className="mx-auto max-w-3xl"><a href="#/" className="text-sm font-medium text-indigo-600 dark:text-indigo-400">← All tools</a><h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{definition.title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{definition.description}</p><div className="mt-8">{form}</div>{result && <ResultsDisplay results={result.result} disclaimer={result.metadata.disclaimer} cached={result.cached} />}</article>;
}
