import type { IconName } from "@/components/ui/Icon";
import type { SkillKey } from "@/lib/taxonomy";
import type { Locale } from "@/lib/i18n/config";
import type { LearnSkill, RawLearnContent } from "./types";

/** Locale-independent facts about each learnable skill. Order = display order. */
export const LEARN_META: { id: string; skill: SkillKey; icon: IconName; minutes: number }[] = [
  { id: "cooking", skill: "cooking", icon: "ChefHat", minutes: 18 },
  { id: "tailoring", skill: "sewing", icon: "Scissors", minutes: 20 },
  { id: "repair", skill: "repair", icon: "Wrench", minutes: 18 },
  { id: "gardening", skill: "gardening", icon: "Sprout", minutes: 15 },
  { id: "digital", skill: "digital_basics", icon: "Keyboard", minutes: 20 },
  { id: "nursery", skill: "plant_care", icon: "Wheat", minutes: 15 },
  { id: "packaging", skill: "packing", icon: "Package", minutes: 12 },
  { id: "sales", skill: "sales", icon: "Store", minutes: 15 },
];

/** Locales whose content has passed human review. Others show "Translation under review". */
export const REVIEWED_LOCALES: Locale[] = ["en", "hi"];

export function mergeContent(locale: Locale, local: RawLearnContent | undefined, en: RawLearnContent): LearnSkill[] {
  return LEARN_META.flatMap((m) => {
    const src = local?.skills[m.id] ?? en.skills[m.id];
    if (!src) return [];
    const reviewed = REVIEWED_LOCALES.includes(locale) && !!local?.skills[m.id];
    return [{ ...m, title: src.title, summary: src.summary, lessons: src.lessons, level: "beginner" as const, status: reviewed || locale === "en" ? ("published" as const) : ("review" as const) }];
  });
}
