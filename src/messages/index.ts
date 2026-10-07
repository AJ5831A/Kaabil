import type { Locale } from "@/lib/i18n/config";
import en from "./en";

export type Messages = Record<string, unknown>;

// Each locale folder exports a merged namespace object. Loaded lazily so the client
// bundle only ships English (fallback) plus the active language.
const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: async () => ({ default: en }),
  hi: () => import("./hi").catch(() => ({ default: {} })),
  mr: () => import("./mr").catch(() => ({ default: {} })),
  bn: () => import("./bn").catch(() => ({ default: {} })),
  ta: () => import("./ta").catch(() => ({ default: {} })),
  te: () => import("./te").catch(() => ({ default: {} })),
  kn: () => import("./kn").catch(() => ({ default: {} })),
  gu: () => import("./gu").catch(() => ({ default: {} })),
  pa: () => import("./pa").catch(() => ({ default: {} })),
};

export const englishMessages: Messages = en;

export async function loadMessages(locale: Locale): Promise<Messages> {
  const mod = await loaders[locale]();
  return mod.default;
}
