export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ApiEnvelope<T extends Record<string, JsonValue>> {
  result: T;
  metadata: { timestamp: string; id: string; disclaimer: string };
  cached: boolean;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: "number" | "text" | "date" | "datetime-local" | "textarea" | "select" | "checkbox";
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly string[];
  required?: boolean;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  description: string;
  endpoint: string;
  fields: readonly FieldDefinition[];
}
