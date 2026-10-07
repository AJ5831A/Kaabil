"use client";

import { useT } from "@/lib/i18n/client";
import { AdminHeader, Card } from "../../_components/ui";
import { getLearnSkills } from "@/content/learn";
import { LOCALES } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Badge";

export default function LearningPage() {
  const { t, locale } = useT();
  const skills = getLearnSkills(locale);
  const statusByLocale = LOCALES.map((l) => ({ l, skills: getLearnSkills(l.code) }));
  return (
    <>
      <AdminHeader title={t("admin.learning.title")} lede={t("admin.learning.lede")} />
      {!skills.length && <Card><p className="text-sm text-subtle">{t("admin.learning.missing")}</p></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-line text-gold">
                <Icon name={s.icon} className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-subtle">
                  {t("admin.learning.lessons", { n: s.lessons.length })} · {t("admin.learning.minutes", { n: s.minutes })}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{s.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {statusByLocale.map(({ l, skills: ls }) => {
                const st = ls.find((x) => x.id === s.id)?.status ?? "review";
                return (
                  <Pill key={l.code} tone={st === "published" ? "ok" : "warn"} className="!text-[0.65rem]">
                    {l.label} · {t(`admin.learning.status.${st}`)}
                  </Pill>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-subtle">{t("admin.learning.howTo")}</p>
    </>
  );
}
