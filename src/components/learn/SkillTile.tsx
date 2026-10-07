"use client";

import { Tile } from "@/components/ui/Tile";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import type { LearnSkill } from "@/content/learn/types";
import { ProgressRing } from "./ProgressRing";

export function SkillTile({ skill, index }: { skill: LearnSkill; index: number }) {
  const { t } = useT();
  const prog = useApp((s) => s.learning[skill.id]);
  const done = prog?.completedLessons.filter((id) => skill.lessons.some((l) => l.id === id)).length ?? 0;
  const total = skill.lessons.length;
  return (
    <Tile
      index={index}
      icon={skill.icon}
      href={`/learn/${skill.id}`}
      label={skill.title}
      sub={skill.summary}
      square={false}
      size="lg"
      listen={`${skill.title}. ${skill.summary}`}
      badge={<ProgressRing value={total ? done / total : 0} size={36} label={t("learn.progress", { done, total })} />}
      meta={`${t("learn.beginner")} · ${t("learn.lessons", { n: total })} · ${t("learn.minutes", { n: skill.minutes })}`}
      className="h-full min-h-56"
    />
  );
}
