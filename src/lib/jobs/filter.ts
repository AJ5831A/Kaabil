import { z } from "zod";
import { HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS } from "@/lib/taxonomy";
import { haversineKm, townById } from "@/lib/geo/towns";
import type { PublicJob } from "@/lib/types";

export const JobFiltersSchema = z.object({
  townId: z.string().max(40).optional(),
  maxDistanceKm: z.coerce.number().min(1).max(500).optional(),
  minPay: z.coerce.number().min(0).max(1_000_000).optional(),
  type: z.enum(JOB_TYPES).optional(),
  hoursBand: z.enum(HOURS_BANDS).optional(),
  skill: z.enum(SKILLS).optional(),
  category: z.enum(JOB_CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
  verifiedOnly: z.union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")]).optional(),
  q: z.string().max(80).optional(),
  sort: z.enum(["distance", "pay", "newest"]).optional(),
});
export type JobFilters = z.infer<typeof JobFiltersSchema>;

/** Pure, deterministic filtering used by the API, Saathi tools and tests. */
export function filterJobs(jobs: PublicJob[], f: JobFilters): PublicJob[] {
  const origin = townById(f.townId);
  let out = jobs.map((j) => (origin ? { ...j, distanceKm: Math.round(haversineKm(origin, j) * 10) / 10 } : { ...j }));

  if (origin && f.maxDistanceKm != null) out = out.filter((j) => (j.distanceKm ?? 0) <= f.maxDistanceKm!);
  if (f.minPay != null) out = out.filter((j) => j.payMax >= f.minPay!);
  if (f.type) out = out.filter((j) => j.type === f.type);
  if (f.hoursBand) out = out.filter((j) => j.hoursBand === f.hoursBand || j.hoursBand === "flexible");
  if (f.skill) out = out.filter((j) => j.skills.includes(f.skill as PublicJob["skills"][number]));
  if (f.category) out = out.filter((j) => j.category === f.category);
  if (f.verifiedOnly) out = out.filter((j) => j.verified);
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(
      (j) =>
        j.category.includes(q) ||
        j.employer.name.toLowerCase().includes(q) ||
        Object.values(j.title ?? {}).some((t) => t?.toLowerCase().includes(q)) ||
        j.skills.some((s) => s.includes(q)),
    );
  }

  const sort = f.sort ?? (origin ? "distance" : "pay");
  out.sort((a, b) => {
    // Verified listings always rank above unverified ones.
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (sort === "distance") return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    if (sort === "pay") return b.payMax - a.payMax;
    return 0;
  });
  return out;
}
