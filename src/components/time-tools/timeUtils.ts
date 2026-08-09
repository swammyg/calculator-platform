export const MAJOR_TIMEZONES = ["UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Toronto", "Asia/Tokyo", "Asia/Singapore", "Asia/Dubai", "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland", "Africa/Johannesburg"] as const;

export function ageFromDate(birthdate: string, referenceDate = new Date()): { years: number; months: number; days: number; totalDays: number } | null {
  const birth = new Date(`${birthdate}T00:00:00`); if (Number.isNaN(birth.getTime()) || birth > referenceDate) return null;
  let years = referenceDate.getFullYear() - birth.getFullYear(); let months = referenceDate.getMonth() - birth.getMonth(); let days = referenceDate.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0).getDate(); } if (months < 0) { years--; months += 12; }
  return { years, months, days, totalDays: Math.floor((referenceDate.getTime() - birth.getTime()) / 86_400_000) };
}

export function remainingTo(target: string): { total: number; days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)); const days = Math.floor(total / 86400); const hours = Math.floor(total % 86400 / 3600); const minutes = Math.floor(total % 3600 / 60); return { total, days, hours, minutes, seconds: total % 60 };
}
