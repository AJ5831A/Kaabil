"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { useLearnContent } from "@/content/learn/client";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { ProgressRing, Stars, starsFor } from "@/components/learn/ProgressRing";
import { TrainingList } from "@/components/learn/TrainingList";
import { Icon } from "@/components/ui/Icon";
import { Button, LinkButton } from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { openSaathi } from "@/lib/saathi/bus";
import { useMounted } from "@/components/learn/useMounted";

export default function SkillPage() {
  const { skill: id } = useParams<{ skill: string }>();
  const { t } = useT();
  const { skills, ready } = useLearnContent();
  const progress = useApp((s) => s.learning[id]);
  const skill = skills.find((s) => s.id === id);
  const [chosen, setChosen] = useState<number | null>(null);

  const mounted = useMounted();

  if (!ready || !mounted) return <div className="glass h-64 overflow-hidden rounded-[2rem]"><div className="shimmer h-full opacity-40" /></div>;
  if (!skill)
    return (
      <div className="py-20 text-center">
        <p className="font-display text-3xl">{t("learn.notFound")}</p>
        <LinkButton href="/learn" variant="glass" icon="ArrowLeft" className="mt-6">
          {t("learn.backToSkills")}
        </LinkButton>
      </div>
    );

  const done = new Set(progress?.completedLessons ?? []);
  const doneCount = skill.lessons.filter((l) => done.has(l.id)).length;
  const firstOpen = skill.lessons.findIndex((l) => !done.has(l.id));
  const active = chosen ?? (firstOpen === -1 ? 0 : firstOpen);
  const lesson = skill.lessons[active];

  return (
    <div>
      <Link href="/learn" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
        <Icon name="ArrowLeft" className="size-4" /> {t("learn.backToSkills")}
      </Link>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-start gap-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-line-strong bg-gold/10 text-gold">
          <Icon name={skill.icon} className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">{t("learn.beginner")} · {t("learn.lessons", { n: skill.lessons.length })} · {t("learn.minutes", { n: skill.minutes })}</div>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{skill.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{skill.summary}</p>
          {skill.status === "review" && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-warn">
              <Icon name="Languages" className="size-3.5" /> {t("learn.review")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing value={doneCount / skill.lessons.length} size={56} label={t("learn.progress", { done: doneCount, total: skill.lessons.length })} />
          <ListenButton size="md" text={`${skill.title}. ${skill.summary}`} />
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <nav aria-label={t("learn.lessons", { n: skill.lessons.length })} className="lg:sticky lg:top-24 lg:self-start">
          <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {skill.lessons.map((l, i) => {
              const isDone = done.has(l.id);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => setChosen(i)}
                    aria-current={i === active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                      i === active ? "glass border-gold/40" : "border-line hover:bg-glass",
                    )}
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border font-display text-lg italic", isDone ? "border-gold bg-gold text-gold-ink" : "border-line text-muted")}>
                      {isDone ? <Icon name="Check" className="size-4" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug">{l.title}</span>
                      {isDone && <Stars n={starsFor(progress?.quiz[l.id])} className="mt-1" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div data-secondary className="mt-4 grid gap-2">
            <Button variant="glass" icon="MessageCircle" onClick={() => openSaathi(t("learn.askPrompt", { lesson: lesson.title, skill: skill.title }), { skillId: skill.id, lessonId: lesson.id, screen: "learn" })}>
              {t("learn.askSaathi")}
            </Button>
            <LinkButton href={`/jobs?skill=${skill.skill}`} variant="ghost" icon="Briefcase">
              {t("learn.seeJobs")}
            </LinkButton>
          </div>
        </nav>

        <LessonPlayer
          key={lesson.id}
          skill={skill}
          lesson={lesson}
          index={active}
          onComplete={() => setChosen(active)}
          onNext={active + 1 < skill.lessons.length ? () => (setChosen(active + 1), window.scrollTo({ top: 0, behavior: "smooth" })) : undefined}
        />
      </div>

      <TrainingList skill={skill.skill} />
    </div>
  );
}
