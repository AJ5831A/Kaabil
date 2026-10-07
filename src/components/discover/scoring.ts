import { INTEREST_MAP, type InterestKey, type JobCategory, type SkillKey, type StrengthKey } from "../../lib/taxonomy";

/**
 * Turns activity results into friendly strength indicators.
 * These are gentle hints from short activities — NOT scientific measurements.
 */

export const EXPERIENCE_KEYS = ["home_cooking", "stitching", "farm", "shop", "cleaning", "repair", "care", "craft", "packing", "none"] as const;
export type ExperienceKey = (typeof EXPERIENCE_KEYS)[number];

export const EXPERIENCE_SKILL: Record<ExperienceKey, SkillKey[]> = {
  home_cooking: ["cooking"],
  stitching: ["sewing"],
  farm: ["gardening"],
  shop: ["sales", "customer_service"],
  cleaning: ["cleaning"],
  repair: ["repair", "tools"],
  care: ["caregiving"],
  craft: ["craft"],
  packing: ["packing"],
  none: [],
};

/** Each scenario option nudges one or two strengths. Index-aligned with discover.scenarios.items[i].options. */
export const SCENARIO_STRENGTHS: StrengthKey[][][] = [
  [["communication", "problem_solving"], ["organisation"], []],
  [["practical", "problem_solving"], [], ["practical"]],
  [["organisation", "attention_to_detail"], ["creativity"], []],
];

const INTEREST_STRENGTH: Partial<Record<InterestKey, StrengthKey>> = {
  cooking: "practical",
  sewing: "hand_skills",
  repairing: "problem_solving",
  farming: "practical",
  craft: "creativity",
  cleaning: "organisation",
  tools: "hand_skills",
  selling: "communication",
  helping: "communication",
  packing: "organisation",
};

export interface DiscoverInput {
  interests: InterestKey[];
  /** Matching-pictures task. Null if skipped. */
  attention: { correct: number; wrong: number; total: number } | null;
  /** Tap-in-order task: number of wrong taps. Null if skipped. */
  sequence: { mistakes: number } | null;
  /** Timing task: absolute timing error per round, 0 = perfect, 1 = way off. Null if skipped. */
  coordination: { errors: number[] } | null;
  /** Chosen option index per scenario (-1 = skipped). */
  scenarios: number[];
  experience: ExperienceKey[];
  years: number;
}

export interface DiscoverResult {
  strengths: StrengthKey[];
  skills: SkillKey[];
  preferredWork: JobCategory[];
  scores: Record<StrengthKey, number>;
}

export function scoreDiscovery(input: DiscoverInput): DiscoverResult {
  const s: Record<StrengthKey, number> = {
    accuracy: 0, coordination: 0, communication: 0, creativity: 0, practical: 0,
    hand_skills: 0, organisation: 0, attention_to_detail: 0, problem_solving: 0,
  };

  for (const i of input.interests) {
    const k = INTEREST_STRENGTH[i];
    if (k) s[k] += 1;
  }

  if (input.attention && input.attention.total > 0) {
    const { correct, wrong, total } = input.attention;
    const precision = correct / Math.max(1, correct + wrong);
    const recall = correct / total;
    const q = precision * recall; // 0..1
    s.attention_to_detail += q * 3;
    s.accuracy += q * 2.5;
  }

  if (input.sequence) {
    const q = Math.max(0, 1 - input.sequence.mistakes / 3);
    s.organisation += q * 2.5;
    s.problem_solving += q * 1.5;
  }

  if (input.coordination && input.coordination.errors.length) {
    const avg = input.coordination.errors.reduce((a, b) => a + b, 0) / input.coordination.errors.length;
    const q = Math.max(0, 1 - avg * 2.5); // avg error 0.4+ → 0
    s.coordination += q * 3;
    s.hand_skills += q * 1.5;
  }

  input.scenarios.forEach((choice, i) => {
    for (const k of SCENARIO_STRENGTHS[i]?.[choice] ?? []) s[k] += 1.5;
  });

  const hands = input.experience.filter((e) => e !== "none").length;
  if (hands) {
    s.practical += Math.min(3, hands) * 0.8 + Math.min(input.years, 5) * 0.2;
    if (input.experience.some((e) => ["stitching", "craft", "repair"].includes(e))) s.hand_skills += 1;
    if (input.experience.some((e) => ["shop", "care"].includes(e))) s.communication += 1;
  }

  const ranked = (Object.keys(s) as StrengthKey[]).filter((k) => s[k] > 0).sort((a, b) => s[b] - s[a]);
  const strong = ranked.filter((k) => s[k] >= 1.5);
  let strengths = strong.slice(0, 4);
  if (strengths.length < 2) strengths = ranked.slice(0, Math.max(2, strengths.length));
  if (strengths.length < 2) strengths = Array.from(new Set([...strengths, "practical", "communication"] as StrengthKey[])).slice(0, 2);

  const skills = new Set<SkillKey>();
  for (const e of input.experience) EXPERIENCE_SKILL[e].forEach((k) => skills.add(k));
  for (const i of input.interests) {
    const first = INTEREST_MAP[i]?.skills[0];
    if (first && i !== "other") skills.add(first);
  }

  const work = new Set<JobCategory>();
  for (const i of input.interests) INTEREST_MAP[i]?.categories.forEach((c) => work.add(c));

  return { strengths, skills: [...skills], preferredWork: [...work], scores: s };
}
