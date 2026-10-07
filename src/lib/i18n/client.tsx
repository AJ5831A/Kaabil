"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { englishMessages, loadMessages, type Messages } from "@/messages";
import { pick as pickL10n, type L10n, type Locale } from "./config";
import { hasKey, translate, translateList, type Vars } from "./format";
import { useApp } from "@/lib/store/app";

interface I18nCtx {
  locale: Locale;
  messages: Messages;
  t: (key: string, vars?: Vars) => string;
  tl: (key: string) => string[];
  has: (key: string) => boolean;
  pick: (v: L10n | string | undefined) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale: Locale;
  initialMessages: Messages;
  children: React.ReactNode;
}) {
  const storeLocale = useApp((s) => s.locale);
  const hydrated = useApp((s) => s.hydrated);
  const [state, setState] = useState({ locale: initialLocale, messages: initialMessages });

  // The persisted store is the source of truth once hydrated.
  useEffect(() => {
    if (!hydrated || storeLocale === state.locale) return;
    let alive = true;
    loadMessages(storeLocale).then((m) => alive && setState({ locale: storeLocale, messages: m }));
    document.documentElement.lang = storeLocale;
    return () => {
      alive = false;
    };
  }, [hydrated, storeLocale, state.locale]);

  const t = useCallback((k: string, v?: Vars) => translate(state.messages, englishMessages, k, v), [state.messages]);
  const tl = useCallback((k: string) => translateList(state.messages, englishMessages, k), [state.messages]);
  const has = useCallback((k: string) => hasKey(state.messages, englishMessages, k), [state.messages]);
  const pick = useCallback((v: L10n | string | undefined) => pickL10n(v, state.locale), [state.locale]);

  const value = useMemo(() => ({ ...state, t, tl, has, pick }), [state, t, tl, has, pick]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useT must be used inside <I18nProvider>");
  return c;
}
