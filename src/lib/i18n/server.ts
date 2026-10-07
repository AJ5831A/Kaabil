import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { englishMessages, loadMessages } from "@/messages";
import { translate, type Vars } from "./format";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export async function getTranslator(locale?: Locale) {
  const l = locale ?? (await getLocale());
  const msgs = await loadMessages(l);
  return { locale: l, messages: msgs, t: (key: string, vars?: Vars) => translate(msgs, englishMessages, key, vars) };
}
