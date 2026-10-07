import type { Locale } from "@/lib/i18n/config";

const intlLocale = (l: Locale) => `${l}-IN`;

export function formatRupees(n: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function formatPayRange(min: number, max: number, locale: Locale) {
  return min === max ? formatRupees(min, locale) : `${formatRupees(min, locale)} – ${formatRupees(max, locale)}`;
}

/** "09:00" -> "9 AM" (locale aware). */
export function formatTime(hhmm: string, locale: Locale) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat(intlLocale(locale), { hour: "numeric", minute: m ? "2-digit" : undefined }).format(d);
}

export function formatShift(s: { start: string; end: string }, locale: Locale) {
  return `${formatTime(s.start, locale)} – ${formatTime(s.end, locale)}`;
}

export function formatDate(d: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}
