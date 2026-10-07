/**
 * Learning content — server-safe, synchronous accessors (used by Saathi tools & server code).
 * Client components should prefer `useLearnContent()` from ./client to load only the active locale.
 *
 * To add a locale file: create src/content/learn/<code>.json with the same shape as en.json,
 * then register it in BOTH `ALL` below and `loaders` in ./client.ts.
 */
import type { Locale } from "@/lib/i18n/config";
import type { LearnSkill, RawLearnContent } from "./types";
import { mergeContent } from "./meta";
import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";
import bn from "./bn.json";
import ta from "./ta.json";
import te from "./te.json";
import kn from "./kn.json";
import gu from "./gu.json";
import pa from "./pa.json";

export type { LearnSkill, Lesson, LessonStep, QuizItem } from "./types";
export { LEARN_META } from "./meta";

const ALL: Partial<Record<Locale, RawLearnContent>> = { en, hi, mr, bn, ta, te, kn, gu, pa };

export function getLearnSkills(locale: Locale): LearnSkill[] {
  return mergeContent(locale, ALL[locale], en);
}

export function getLearnSkill(id: string, locale: Locale): LearnSkill | undefined {
  return getLearnSkills(locale).find((s) => s.id === id);
}
