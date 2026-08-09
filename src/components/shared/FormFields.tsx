import type { FieldDefinition, JsonValue } from "../../types";

export function initialFormValues(fields: readonly FieldDefinition[]): Record<string, JsonValue> {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? (field.type === "checkbox" ? false : "")]));
}

export function FormFields({ fields, values, onChange }: { fields: readonly FieldDefinition[]; values: Record<string, JsonValue>; onChange: (name: string, value: JsonValue) => void }): JSX.Element {
  return <>{fields.map((field) => <FormField key={field.name} field={field} value={values[field.name]} onChange={(value) => onChange(field.name, value)} />)}</>;
}

function FormField({ field, value, onChange }: { field: FieldDefinition; value: JsonValue; onChange: (value: JsonValue) => void }): JSX.Element {
  const id = `field-${field.name}`; const classes = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950";
  if (field.type === "checkbox") return <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"><input id={id} checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.target.checked)} /><span>{field.label}</span></label>;
  if (field.type === "textarea") return <label className="block text-sm font-medium" htmlFor={id}>{field.label}<textarea id={id} className={`${classes} min-h-32`} value={String(value ?? "")} required={field.required} onChange={(event) => onChange(event.target.value)} /></label>;
  if (field.type === "select") return <label className="block text-sm font-medium" htmlFor={id}>{field.label}<select id={id} className={classes} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>{field.options?.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
  return <label className="block text-sm font-medium" htmlFor={id}>{field.label}<input id={id} className={classes} type={field.type} min={field.min} max={field.max} step={field.step ?? (field.type === "number" ? "any" : undefined)} value={String(value ?? "")} required={field.required} onChange={(event) => onChange(field.type === "number" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value)} /></label>;
}
