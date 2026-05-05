/* Date helpers. All dates are local-day strings (YYYY-MM-DD) to keep
   timezone reasoning simple; the user is single-timezone for v1. */

export function today(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = fromIsoDate(s);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

export function isToday(s: string | null): boolean {
  return !!s && s === today();
}

export function isPast(s: string | null): boolean {
  return !!s && s < today();
}

/** Day-of-week index, Sunday = 0 ... Saturday = 6. */
export function dow(s: string): number {
  return fromIsoDate(s).getDay();
}

/** Greeting key based on local hour. */
export function greetingPart(): "morning" | "day" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "day";
  return "evening";
}

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const WEEKDAYS_RU = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];

export function formatDateRu(s: string): string {
  const d = fromIsoDate(s);
  const wd = WEEKDAYS_RU[d.getDay()];
  const day = d.getDate();
  const m = MONTHS_RU[d.getMonth()];
  return `${wd}, ${day} ${m}`;
}
