"use client";

import { useCallback } from "react";
import { useT } from "@/lib/i18n/client";
import { townById } from "@/lib/geo/towns";
import { formatPayRange, formatShift } from "@/lib/format";
import type { PublicJob } from "@/lib/types";

/** Localised strings for a job record (no free text invented). */
export function useJobText() {
  const { t, pick, locale } = useT();
  return useCallback(
    (job: PublicJob) => {
      const title = job.title ? pick(job.title) : t(`common.jobCategories.${job.category}`);
      const town = pick(townById(job.townId)?.name) || job.townId;
      const pay = `${formatPayRange(job.payMin, job.payMax, locale)} ${t(`common.pay.${job.payPeriod}`)}`;
      const hours = formatShift(job.shift, locale);
      const type = t(`common.jobType.${job.type}`);
      const verification = job.verified ? t("common.trust.verified") : t("common.trust.notVerified");
      const distance = job.distanceKm != null && job.distanceKm >= 1 ? t("common.units.km", { n: Math.round(job.distanceKm) }) : undefined;
      const skills = job.skills.map((s) => t(`common.skills.${s}`));
      const speech = [title, job.employer.name, town, pay, `${type}, ${hours}`, verification].join(". ");
      return { title, town, pay, hours, type, verification, distance, skills, speech };
    },
    [t, pick, locale],
  );
}
