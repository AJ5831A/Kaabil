import type { Messages } from "@/messages";

export type Vars = Record<string, string | number>;

function lookup(obj: Messages, key: string): unknown {
  let cur: unknown = obj;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else return undefined;
  }
  return cur;
}

export function interpolate(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Resolve a key against the active locale, falling back to English, then the key itself. */
export function translate(primary: Messages, fallback: Messages, key: string, vars?: Vars): string {
  const v = lookup(primary, key) ?? lookup(fallback, key);
  if (typeof v === "string") return interpolate(v, vars);
  if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing key: ${key}`);
  return key;
}

export function translateList(primary: Messages, fallback: Messages, key: string): string[] {
  const v = lookup(primary, key) ?? lookup(fallback, key);
  return Array.isArray(v) ? (v as string[]) : [];
}

export function hasKey(primary: Messages, fallback: Messages, key: string) {
  return typeof (lookup(primary, key) ?? lookup(fallback, key)) === "string";
}
