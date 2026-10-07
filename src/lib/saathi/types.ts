import { z } from "zod";
import { LOCALE_CODES, type Locale } from "@/lib/i18n/config";
import { HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS, STRENGTHS, INTERESTS } from "@/lib/taxonomy";
import type { HoursBand, JobCategory, JobType, SkillKey } from "@/lib/taxonomy";
import type { SaathiBlock } from "@/lib/store/app";

/** Guided job-search flow state, round-tripped between client and server. */
export interface FlowState {
  mode?: "job" | "learn";
  category?: JobCategory;
  skill?: SkillKey;
  townId?: string;
  maxDistanceKm?: number;
  type?: JobType;
  /** User said either full- or part-time is fine. */
  anyType?: boolean;
  hoursBand?: HoursBand;
  experience?: "yes" | "no";
  /** The slot Saathi asked about last; the next answer fills it. */
  asked?: "work" | "place" | "distance" | "type" | "hours" | "experience";
  /** Refining after results were shown. */
  refining?: boolean;
  lastJobIds?: string[];
}

export const SLOTS = ["work", "place", "distance", "type", "hours", "experience"] as const;

const categoryKeys = JOB_CATEGORIES.map((c) => c.key) as [JobCategory, ...JobCategory[]];

export const FlowSchema = z
  .object({
    mode: z.enum(["job", "learn"]).optional(),
    category: z.enum(categoryKeys).optional(),
    skill: z.enum(SKILLS).optional(),
    townId: z.string().max(40).optional(),
    maxDistanceKm: z.number().min(1).max(500).optional(),
    type: z.enum(JOB_TYPES).optional(),
    anyType: z.boolean().optional(),
    hoursBand: z.enum(HOURS_BANDS).optional(),
    experience: z.enum(["yes", "no"]).optional(),
    asked: z.enum(SLOTS).optional(),
    refining: z.boolean().optional(),
    lastJobIds: z.array(z.string().max(40)).max(20).optional(),
  })
  .strict();

export const ProfileSummarySchema = z.object({
  name: z.string().max(60).optional(),
  interests: z.array(z.enum(INTERESTS.map((i) => i.key) as [string, ...string[]])).max(12).optional(),
  strengths: z.array(z.enum(STRENGTHS)).max(12).optional(),
  skills: z.array(z.enum(SKILLS)).max(14).optional(),
  townId: z.string().max(40).optional(),
  maxDistanceKm: z.number().min(1).max(500).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  hoursBand: z.enum(HOURS_BANDS).optional(),
  experience: z.string().max(300).optional(),
  learning: z.array(z.object({ skillId: z.string().max(40), done: z.number().int().min(0).max(99), total: z.number().int().min(0).max(99).optional() })).max(12).optional(),
  savedJobIds: z.array(z.string().max(40)).max(10).optional(),
  pastSummaries: z.array(z.string().max(300)).max(5).optional(),
});
export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;

export const SaathiRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .min(1)
    .max(16),
  locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]),
  profile: ProfileSummarySchema.default({}),
  context: z
    .object({ jobId: z.string().max(40).optional(), skillId: z.string().max(40).optional(), lessonId: z.string().max(40).optional(), screen: z.string().max(80).optional() })
    .optional(),
  /** Structured value of a tapped quick-reply chip, e.g. "cat:cook" or "town:pilani". */
  chip: z.string().max(60).optional(),
  flow: FlowSchema.optional(),
});
export type SaathiRequest = z.infer<typeof SaathiRequestSchema>;

export type SaathiAction =
  | { kind: "navigate"; href: string }
  | { kind: "add_to_parchi"; jobId: string }
  | { kind: "save_profile"; patch: Record<string, unknown> }
  | { kind: "print_parchi"; which: "profile" | "options" | "job"; jobId?: string }
  | { kind: "report"; jobId: string };

export type SaathiEvent =
  | { type: "text"; delta: string }
  | { type: "block"; block: SaathiBlock }
  | { type: "action"; action: SaathiAction }
  | { type: "flow"; flow: FlowState }
  | { type: "meta"; engine: "gemini" | "fallback" }
  | { type: "done" }
  | { type: "error"; message?: string };

export type Emit = (e: SaathiEvent) => void;

/** Screens Saathi may navigate to. Anything else is rejected. */
export const SCREENS: Record<string, string> = {
  home: "/",
  discover: "/discover",
  learn: "/learn",
  jobs: "/jobs",
  nearby: "/jobs/nearby",
  compare: "/jobs/compare",
  parchi: "/parchi",
  job_options_parchi: "/parchi/options",
  profile: "/profile",
  settings: "/settings",
  station: "/station",
};

export function safeHref(href: string): string | null {
  if (Object.values(SCREENS).includes(href)) return href;
  if (/^\/(jobs|parchi\/job)\/[a-z0-9_-]{1,40}$/i.test(href)) return href;
  if (/^\/learn\/[a-z0-9_-]{1,40}$/i.test(href)) return href;
  return null;
}
