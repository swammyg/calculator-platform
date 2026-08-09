import { useEffect, useState } from "react";
import { calculate } from "../../api/client";
import { trackToolUsed } from "../../analytics/ga4";
import type { JsonValue } from "../../types";

const ECONOMY_ZONES = [
  ["United States", "America/New_York"], ["United States", "America/Chicago"], ["United States", "America/Denver"], ["United States", "America/Los_Angeles"], ["United States", "America/Anchorage"], ["United States", "Pacific/Honolulu"],
  ["China", "Asia/Shanghai"], ["China", "Asia/Urumqi"], ["Japan", "Asia/Tokyo"], ["Germany", "Europe/Berlin"], ["India", "Asia/Kolkata"], ["United Kingdom", "Europe/London"], ["France", "Europe/Paris"], ["Italy", "Europe/Rome"],
  ["Canada", "America/Toronto"], ["Canada", "America/Winnipeg"], ["Canada", "America/Edmonton"], ["Canada", "America/Vancouver"], ["Canada", "America/Halifax"],
  ["Brazil", "America/Sao_Paulo"], ["Brazil", "America/Manaus"], ["Brazil", "America/Belem"],
  ["Russia", "Europe/Kaliningrad"], ["Russia", "Europe/Moscow"], ["Russia", "Asia/Yekaterinburg"], ["Russia", "Asia/Omsk"], ["Russia", "Asia/Krasnoyarsk"], ["Russia", "Asia/Irkutsk"], ["Russia", "Asia/Yakutsk"], ["Russia", "Asia/Vladivostok"], ["Russia", "Asia/Magadan"], ["Russia", "Asia/Kamchatka"],
  ["South Korea", "Asia/Seoul"], ["Australia", "Australia/Sydney"], ["Australia", "Australia/Perth"], ["Australia", "Australia/Adelaide"], ["Australia", "Australia/Darwin"], ["Australia", "Australia/Brisbane"],
  ["Spain", "Europe/Madrid"], ["Spain", "Atlantic/Canary"], ["Mexico", "America/Mexico_City"], ["Mexico", "America/Tijuana"], ["Mexico", "America/Cancun"], ["Indonesia", "Asia/Jakarta"], ["Indonesia", "Asia/Makassar"], ["Indonesia", "Asia/Jayapura"],
  ["Netherlands", "Europe/Amsterdam"], ["Turkey", "Europe/Istanbul"], ["Saudi Arabia", "Asia/Riyadh"], ["Switzerland", "Europe/Zurich"], ["Poland", "Europe/Warsaw"], ["Taiwan", "Asia/Taipei"], ["Belgium", "Europe/Brussels"], ["Sweden", "Europe/Stockholm"], ["Ireland", "Europe/Dublin"]
] as const;
type ZoneOption = readonly [country: string, timezone: string];
const LOCATION_ALIASES: Readonly<Record<string, ZoneOption>> = {
  austin: ["Austin, Texas", "America/Chicago"],
  "austin texas": ["Austin, Texas", "America/Chicago"],
  texas: ["Texas, United States", "America/Chicago"],
  fiji: ["Fiji", "Pacific/Fiji"],
};
type Zone = { timezone: string; date: string; time: string };
const fieldClasses = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950";

function parsed(value: string): Pick<Zone, "date" | "time"> { const [date = "", time = ""] = value.split(" "); return { date, time: time.slice(0, 5) }; }
function cityFromTimezone(timezone: string): string { return timezone.split("/").at(-1)?.replaceAll("_", " ") ?? timezone; }
function compareZoneOptions([leftCountry, leftTimezone]: ZoneOption, [rightCountry, rightTimezone]: ZoneOption): number { return cityFromTimezone(leftTimezone).localeCompare(cityFromTimezone(rightTimezone)) || leftCountry.localeCompare(rightCountry); }
function zoneOptionLabel([country, timezone]: ZoneOption): string { const city = cityFromTimezone(timezone); return city.toLocaleLowerCase() === country.toLocaleLowerCase() ? `${city} (${timezone})` : `${city} — ${country} (${timezone})`; }
function localReferenceZone(): Zone {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";
  return { timezone, date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` };
}

export function TimeZoneConverterTool(): JSX.Element {
  const [zones, setZones] = useState<Zone[]>(() => { const local = localReferenceZone(); return [local, { timezone: "Europe/London", date: local.date, time: local.time }]; });
  const [customZones, setCustomZones] = useState<ZoneOption[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("Meeting");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [error, setError] = useState(""); const [updating, setUpdating] = useState(false);
  const zoneOptions: readonly ZoneOption[] = [...ECONOMY_ZONES, ...customZones].sort(compareZoneOptions);

  async function convertFrom(referenceIndex: number, nextZones: Zone[]): Promise<void> {
    const reference = nextZones[referenceIndex]; setUpdating(true); setError("");
    try {
      const converted = await Promise.all(nextZones.map(async (zone, index) => {
        if (index === referenceIndex) return reference;
        const response = await calculate<Record<string, JsonValue>>("/api/v1/tools/time/timezone-converter", { source_timezone: reference.timezone, target_timezone: zone.timezone, date_time: `${reference.date}T${reference.time}` });
        trackToolUsed("time", "timezone-converter", response.result);
        return { ...zone, ...parsed(String(response.result.target_time)) };
      }));
      setZones(converted);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Choose a valid date, time and country timezone."); }
    finally { setUpdating(false); }
  }

  useEffect(() => { void convertFrom(0, zones); }, []); // Initial conversion only.
  function update(index: number, change: Partial<Zone>): void { const next = zones.map((zone, position) => position === index ? { ...zone, ...change } : zone); setZones(next); void convertFrom(0, next); }
  async function copy(): Promise<void> { await navigator.clipboard?.writeText(zones.map((zone) => `${zone.timezone}: ${zone.date} ${zone.time}`).join("\n")); }
  function dateForCalendar(zone: Zone): string { return `${zone.date.replaceAll("-", "")}T${zone.time.replaceAll(":", "")}00`; }
  function endForCalendar(zone: Zone): string { const start = new Date(`${zone.date}T${zone.time}:00`); start.setMinutes(start.getMinutes() + durationMinutes); return `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, "0")}${String(start.getDate()).padStart(2, "0")}T${String(start.getHours()).padStart(2, "0")}${String(start.getMinutes()).padStart(2, "0")}00`; }
  function googleCalendar(): void { const reference = zones[0]; const params = new URLSearchParams({ action: "TEMPLATE", text: meetingTitle || "Meeting", dates: `${dateForCalendar(reference)}/${endForCalendar(reference)}`, ctz: reference.timezone }); window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer"); }
  function outlookCalendar(): void { const reference = zones[0]; const params = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: meetingTitle || "Meeting", startdt: `${reference.date}T${reference.time}:00`, enddt: `${endForCalendar(reference).slice(0, 4)}-${endForCalendar(reference).slice(4, 6)}-${endForCalendar(reference).slice(6, 8)}T${endForCalendar(reference).slice(9, 11)}:${endForCalendar(reference).slice(11, 13)}:00` }); window.open(`https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`, "_blank", "noopener,noreferrer"); }
  function downloadCalendar(): void { const reference = zones[0]; const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kalko//Meeting Scheduler//EN", "BEGIN:VEVENT", `UID:${crypto.randomUUID()}@kalko.uk`, `DTSTART;TZID=${reference.timezone}:${dateForCalendar(reference)}`, `DTEND;TZID=${reference.timezone}:${endForCalendar(reference)}`, `SUMMARY:${(meetingTitle || "Meeting").replaceAll("\\n", " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"); const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "kalko-meeting.ics"; link.click(); URL.revokeObjectURL(url); }

  function addCustomZone(option: ZoneOption): void { setCustomZones((previous) => previous.some(([, timezone]) => timezone === option[1]) ? previous : [...previous, option]); }
  return <section className="grid gap-5"><div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Meeting scheduler</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your local time is the fixed reference. Add attendee timezones to see their matching time.</p></div><span className="text-sm text-indigo-600">{updating ? "Updating…" : "Ready"}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem]"><label className="text-sm font-medium">Meeting title<input value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder="e.g. Weekly team sync" className={fieldClasses} /></label><label className="text-sm font-medium">Duration (minutes)<input type="number" min="1" max="1440" value={durationMinutes} onChange={(event) => setDurationMinutes(Math.max(1, Math.min(1440, Number(event.target.value) || 60)))} className={fieldClasses} /></label></div><div className="mt-5 grid gap-4">{zones.map((zone, index) => <div key={`${zone.timezone}-${index}`} className="grid gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 lg:grid-cols-[minmax(15rem,1fr)_10rem_9rem_auto]"><ZoneSelect label={index === 0 ? "Your local timezone" : `Attendee ${index + 1} timezone`} value={zone.timezone} options={zoneOptions} disabled={index === 0} onAddOption={addCustomZone} onChange={(timezone) => update(index, { timezone })} /><label className="text-sm font-medium">Local date<input type="date" value={zone.date} onChange={(event) => update(index, { date: event.target.value })} disabled={index !== 0} className={fieldClasses} /></label><label className="text-sm font-medium">Local time<input type="time" value={zone.time} onChange={(event) => update(index, { time: event.target.value })} disabled={index !== 0} className={fieldClasses} /></label><div className="flex items-end">{zones.length > 2 && index > 0 && <button type="button" onClick={() => setZones((previous) => previous.filter((_, position) => position !== index))} className="rounded-lg border border-slate-300 px-3 py-3 text-sm">Remove</button>}</div></div>)}</div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setZones((previous) => [...previous, { timezone: "Asia/Tokyo", date: zones[0].date, time: zones[0].time }])} className="rounded-lg border border-indigo-300 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">+ Add attendee timezone</button><button type="button" onClick={() => void copy()} className="rounded-lg border border-slate-300 px-4 py-3 text-sm">Copy schedule</button></div></div><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30"><h2 className="font-semibold">Add to a calendar</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Google Calendar and Outlook open their sign-in flow if needed. Download an .ics file for any calendar app.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={googleCalendar} className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Google Calendar</button><button type="button" onClick={outlookCalendar} className="rounded-lg border border-indigo-300 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">Outlook Calendar</button><button type="button" onClick={downloadCalendar} className="rounded-lg border border-indigo-300 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">Download .ics</button></div></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}</section>;
}

function resolveTimezone(query: string, options: readonly ZoneOption[]): ZoneOption | undefined {
  const normalized = query.trim().toLocaleLowerCase().replaceAll("_", " ");
  if (!normalized) return undefined;
  const alias = LOCATION_ALIASES[normalized];
  if (alias) return alias;
  const existing = options.find(([country, timezone]) => country.toLocaleLowerCase() === normalized || timezone.toLocaleLowerCase() === normalized || timezone.split("/").at(-1)?.replaceAll("_", " ").toLocaleLowerCase() === normalized);
  if (existing) return existing;
  const supportedValuesOf = (Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }).supportedValuesOf;
  const timezone = supportedValuesOf?.("timeZone").find((candidate) => candidate.toLocaleLowerCase() === normalized || candidate.split("/").at(-1)?.replaceAll("_", " ").toLocaleLowerCase() === normalized);
  return timezone ? [timezone.split("/").at(-1)?.replaceAll("_", " ") ?? timezone, timezone] : undefined;
}

function ZoneSelect({ label, value, options, disabled, onAddOption, onChange }: { label: string; value: string; options: readonly ZoneOption[]; disabled?: boolean; onAddOption: (option: ZoneOption) => void; onChange: (value: string) => void }): JSX.Element {
  const listed = options.some(([, timezone]) => timezone === value);
  const [draft, setDraft] = useState(listed ? "" : value);
  const [customMode, setCustomMode] = useState(!listed);
  useEffect(() => { if (!listed) { setCustomMode(true); setDraft(value); } }, [listed, value]);
  const [searchError, setSearchError] = useState("");
  const search = (): void => { const option = resolveTimezone(draft, options); if (!option) { setSearchError("Enter a country, city or valid IANA timezone, for example Fiji, Austin or Pacific/Fiji."); return; } setSearchError(""); setCustomMode(false); onAddOption(option); onChange(option[1]); };
  return <div><label className="block text-sm font-medium">{label}<select value={customMode ? "__custom" : value} disabled={disabled} onChange={(event) => { if (event.target.value === "__custom") { setCustomMode(true); setDraft(listed ? "" : value); setSearchError(""); } else { setCustomMode(false); onChange(event.target.value); } }} className={fieldClasses} aria-label={label}>{options.map((option) => <option key={option[1]} value={option[1]}>{zoneOptionLabel(option)}</option>)}<option value="__custom">Other country / custom timezone…</option></select></label>{customMode && !disabled && <label className="mt-3 block text-sm font-medium">Add a country, city or IANA timezone <span className="font-normal text-slate-500">(e.g. Fiji, Austin, Pacific/Fiji)</span><div className="mt-1 flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} placeholder="e.g. Fiji" className={fieldClasses.replace("mt-1 ", "")} aria-label={`${label} custom timezone`} /><button type="button" onClick={search} disabled={!draft.trim()} className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Add</button></div>{searchError && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{searchError}</p>}</label>}</div>;
}
