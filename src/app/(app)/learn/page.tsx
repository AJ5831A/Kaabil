"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { INTEREST_MAP, type SkillKey } from "@/lib/taxonomy";
import { PageHeader } from "@/components/ui/PageHeader";
import { Rich } from "@/components/ui/Rich";
import { Icon } from "@/components/ui/Icon";
import { useLearnContent } from "@/content/learn/client";
import { SkillTile } from "@/components/learn/SkillTile";
import { useStreak } from "@/components/learn/streak";
import { starsFor } from "@/components/learn/ProgressRing";
import { useMounted } from "@/components/learn/useMounted";

export default function LearnPage() {
  const { t } = useT();
  const { skills, ready: loaded } = useLearnContent();
  const mounted = useMounted();
  const ready = loaded && mounted;
  const profile = useApp((s) => s.profile);
  const learning = useApp((s) => s.learning);
  const { streak } = useStreak();

  const recommendedKeys = useMemo(() => {
    const set = new Set<SkillKey>(profile.skills);
    for (const i of profile.interests) INTEREST_MAP[i]?.skills.forEach((k) => set.add(k));
    return set;
  }, [profile.skills, profile.interests]);

  const recommended = skills.filter((s) => recommendedKeys.has(s.skill));
  const rest = skills.filter((s) => !recommendedKeys.has(s.skill));
  const stars = Object.values(learning).reduce((acc, p) => acc + p.completedLessons.reduce((a, id) => a + starsFor(p.quiz[id]), 0), 0);

  return (
    <div>
      <PageHeader eyebrow={t("learn.eyebrow")} title={t("learn.title")} lede={t("learn.lede")} />

      <div data-secondary className="mb-10 flex min-h-11 flex-wrap gap-3">
        {mounted && (<>
        <span className="glass inline-flex h-11 items-center gap-2.5 rounded-full px-4 text-sm">
          <Icon name="Zap" className="size-4 text-gold" />
          {streak > 0 ? t("learn.streak", { n: streak }) : t("learn.streakNone")}
        </span>
        <span className="glass inline-flex h-11 items-center gap-2.5 rounded-full px-4 text-sm">
          <Icon name="Star" className="size-4 text-gold" fill="currentColor" />
          {t("learn.stars", { n: stars })}
        </span>
        </>)}
      </div>

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass h-56 overflow-hidden rounded-[var(--radius-tile)]">
              <div className="shimmer h-full w-full opacity-40" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {recommended.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-3xl">
                <Rich text={t("learn.recommended")} />
              </h2>
              <p data-secondary className="mb-5 mt-1 text-sm text-muted">{t("learn.recommendedSub")}</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((s, i) => (
                  <SkillTile key={s.id} skill={s} index={i} />
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-5 font-display text-3xl">{t("learn.all")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((s, i) => (
                <SkillTile key={s.id} skill={s} index={i + recommended.length} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
