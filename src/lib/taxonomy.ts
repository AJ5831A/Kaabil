/**
 * Shared vocabularies. Labels live in messages under `common.interests.*`,
 * `common.skills.*`, `common.strengths.*`, `common.jobCategories.*` so every
 * structured record is fully localisable without free text.
 */
export const INTERESTS = [
  { key: "cooking", icon: "ChefHat" },
  { key: "sewing", icon: "Scissors" },
  { key: "repairing", icon: "Wrench" },
  { key: "farming", icon: "Sprout" },
  { key: "craft", icon: "Palette" },
  { key: "cleaning", icon: "Sparkles" },
  { key: "tools", icon: "Hammer" },
  { key: "selling", icon: "Store" },
  { key: "helping", icon: "HeartHandshake" },
  { key: "packing", icon: "Package" },
  { key: "other", icon: "CircleEllipsis" },
] as const;
export type InterestKey = (typeof INTERESTS)[number]["key"];

/** Skills a job can require and a person can have or learn. */
export const SKILLS = [
  "cooking", "cleaning", "sewing", "repair", "gardening", "plant_care", "packing",
  "sales", "digital_basics", "caregiving", "tools", "craft", "driving", "customer_service",
] as const;
export type SkillKey = (typeof SKILLS)[number];

/** Friendly strength indicators (never scientific measurements). */
export const STRENGTHS = [
  "accuracy", "coordination", "communication", "creativity", "practical",
  "hand_skills", "organisation", "attention_to_detail", "problem_solving",
] as const;
export type StrengthKey = (typeof STRENGTHS)[number];

export const JOB_CATEGORIES = [
  { key: "kitchen_helper", icon: "ChefHat", skills: ["cooking", "cleaning"] },
  { key: "cook", icon: "CookingPot", skills: ["cooking"] },
  { key: "housekeeping", icon: "Sparkles", skills: ["cleaning"] },
  { key: "tailoring_assistant", icon: "Scissors", skills: ["sewing"] },
  { key: "nursery_worker", icon: "Sprout", skills: ["gardening", "plant_care"] },
  { key: "packing_helper", icon: "Package", skills: ["packing"] },
  { key: "sales_assistant", icon: "Store", skills: ["sales", "customer_service"] },
  { key: "repair_helper", icon: "Wrench", skills: ["repair", "tools"] },
  { key: "farm_worker", icon: "Wheat", skills: ["gardening"] },
  { key: "caregiver", icon: "HeartHandshake", skills: ["caregiving"] },
  { key: "craft_artisan", icon: "Palette", skills: ["craft"] },
  { key: "data_entry", icon: "Keyboard", skills: ["digital_basics"] },
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number]["key"];

export function categoryMeta(key: JobCategory) {
  return JOB_CATEGORIES.find((c) => c.key === key) ?? JOB_CATEGORIES[0];
}

/** Which job categories and learnable skills relate to a discovered interest. */
export const INTEREST_MAP: Record<InterestKey, { skills: SkillKey[]; categories: JobCategory[] }> = {
  cooking: { skills: ["cooking"], categories: ["kitchen_helper", "cook"] },
  sewing: { skills: ["sewing"], categories: ["tailoring_assistant"] },
  repairing: { skills: ["repair", "tools"], categories: ["repair_helper"] },
  farming: { skills: ["gardening", "plant_care"], categories: ["nursery_worker", "farm_worker"] },
  craft: { skills: ["craft"], categories: ["craft_artisan"] },
  cleaning: { skills: ["cleaning"], categories: ["housekeeping", "kitchen_helper"] },
  tools: { skills: ["tools", "repair"], categories: ["repair_helper"] },
  selling: { skills: ["sales", "customer_service"], categories: ["sales_assistant"] },
  helping: { skills: ["caregiving", "customer_service"], categories: ["caregiver"] },
  packing: { skills: ["packing"], categories: ["packing_helper"] },
  other: { skills: ["digital_basics"], categories: ["data_entry"] },
};

export const JOB_TYPES = ["full_time", "part_time"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const HOURS_BANDS = ["morning", "day", "evening", "flexible"] as const;
export type HoursBand = (typeof HOURS_BANDS)[number];

export const EXPERIENCE_LEVELS = ["none", "preferred", "required"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const TRAINING_OPTIONS = ["provided", "on_job", "not_provided"] as const;
export type TrainingOption = (typeof TRAINING_OPTIONS)[number];
