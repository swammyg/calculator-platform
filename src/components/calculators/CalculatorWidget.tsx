import { useCallback, useState } from "react";
import { calculate } from "../../api/client";
import { CalculatorForm } from "../shared/CalculatorForm";
import { ResultsDisplay } from "../shared/ResultsDisplay";
import { trackCalculatorUsed } from "../../analytics/ga4";
import type { ApiEnvelope, JsonValue, ToolDefinition } from "../../types";

export function CalculatorWidget({ definition }: { definition: ToolDefinition }): JSX.Element {
  const [result, setResult] = useState<ApiEnvelope<Record<string, JsonValue>> | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = useCallback(async (values: Record<string, JsonValue>): Promise<void> => { setLoading(true); setError(""); try { const response = await calculate(definition.endpoint, values); setResult(response); trackCalculatorUsed(definition.slug, response.result); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not calculate that yet. Please check your inputs."); } finally { setLoading(false); } }, [definition.endpoint, definition.slug]);
  return <><CalculatorForm formFields={definition.fields} onSubmit={submit} loading={loading} error={error} />{result && <ResultsDisplay results={result.result} disclaimer={result.metadata.disclaimer} cached={result.cached} />}</>;
}
