"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useT } from "@/lib/i18n/client";
import type { LearnSkill, RawLearnContent } from "./types";
import { mergeContent } from "./meta";

// Only the active locale (+ English fallback) is downloaded. Register new files here.
const loaders: Partial<Record<Locale, () => Promise<{ default: RawLearnContent }>>> = {
  en: () => import("./en.json"),
  hi: () => import("./hi.json"),
  mr: () => import("./mr.json"),
  bn: () => import("./bn.json"),
  ta: () => import("./ta.json"),
  te: () => import("./te.json"),
  kn: () => import("./kn.json"),
  gu: () => import("./gu.json"),
  pa: () => import("./pa.json"),
};

const cache = new Map<Locale, RawLearnContent>();

async function load(l: Locale): Promise<RawLearnContent | undefined> {
  if (cache.has(l)) return cache.get(l);
  const fn = loaders[l];
  if (!fn) return undefined;
  const m = await fn();
  cache.set(l, m.default);
  return m.default;
}

export function useLearnContent(): { skills: LearnSkill[]; ready: boolean } {
  const { locale } = useT();
  const [state, setState] = useState<{ locale: Locale | null; skills: LearnSkill[] }>({ locale: null, skills: [] });
  useEffect(() => {
    let alive = true;
    Promise.all([load("en"), load(locale)]).then(([en, local]) => {
      if (alive && en) setState({ locale, skills: mergeContent(locale, local, en) });
    });
    return () => {
      alive = false;
    };
  }, [locale]);
  return { skills: state.skills, ready: state.locale === locale };
}
