import type { Profile } from "../../lib/store/app";

/** Fraction of ability-first profile fields that are filled (0..1). */
export function profileCompleteness(p: Profile): number {
  const checks = [
    !!p.name.trim(),
    p.strengths.length > 0,
    p.skills.length > 0,
    !!p.experience.trim() || (p.experienceYears ?? 0) > 0,
    p.preferredWork.length > 0,
    !!p.townId,
    !!p.hoursBand,
    !!p.jobType,
    p.languages.length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}
