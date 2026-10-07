"use client";

import { useT } from "@/lib/i18n/client";
import { townById } from "@/lib/geo/towns";
import type { Job } from "@/lib/types";

export function useLabels() {
  const { t, pick, locale } = useT();
  return {
    town: (id: string) => pick(townById(id)?.name) || id,
    category: (c: string) => t(`common.jobCategories.${c}`),
    jobTitle: (j: Pick<Job, "title" | "category">) => (j.title ? pick(j.title) : t(`common.jobCategories.${j.category}`)),
    date: (d?: string) => (d ? new Intl.DateTimeFormat(`${locale}-IN`, { day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : "—"),
    dateTime: (d: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(d)),
  };
}
