import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

type Dict = Record<string, unknown>;
const ROOT = path.resolve(__dirname, "../src/messages");

function load(locale: string): Dict {
  const dir = path.join(ROOT, locale);
  if (!existsSync(dir)) return {};
  const out: Dict = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    out[f.replace(/\.json$/, "")] = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  }
  return out;
}

function get(d: Dict, key: string): unknown {
  return key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Dict)[k] : undefined), d);
}

/** Same resolution as the app: active locale, then English. Strips *emphasis* markers. */
export function messages(locale: string) {
  const primary = load(locale);
  const en = load("en");
  return (key: string, vars?: Record<string, string | number>) => {
    const v = get(primary, key) ?? get(en, key);
    if (typeof v !== "string") throw new Error(`missing message ${key}`);
    return v.replace(/\*/g, "").replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? `{${k}}`));
  };
}

export const LANG_LABEL: Record<string, string> = { hi: "हिन्दी", en: "English" };
export const PILANI: Record<string, string> = { hi: "पिलानी", en: "Pilani" };
