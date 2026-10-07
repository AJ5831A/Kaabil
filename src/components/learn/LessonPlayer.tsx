"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LearnSkill, Lesson } from "@/content/learn/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { speaker } from "@/lib/voice/speaker";
import { celebrate } from "@/lib/celebrate";
import { openSaathi } from "@/lib/saathi/bus";
import { track } from "@/lib/track";
import { Quiz } from "./Quiz";
import { Stars, starsFor } from "./ProgressRing";
import { useStreak } from "./streak";

type Phase = "steps" | "quiz" | "done";

export function LessonPlayer({ skill, lesson, index, onNext, onComplete }: { skill: LearnSkill; lesson: Lesson; index: number; onNext?: () => void; onComplete?: () => void }) {
  const { t } = useT();
  const { speak, stop, speaking, id: speakingId } = useSpeaker();
  const animations = useApp((s) => s.settings.animations);
  const setLessonDone = useApp((s) => s.setLessonDone);
  const updateProfile = useApp((s) => s.updateProfile);
  const awardBadge = useApp((s) => s.awardBadge);
  const { markToday } = useStreak();
  const [phase, setPhase] = useState<Phase>("steps");
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState<number | undefined>();
  const [skillDone, setSkillDone] = useState(false);
  const playToken = useRef(0);
  const playing = speaking && speakingId?.startsWith("lesson:");

  // Stop any narration when leaving / switching lessons.
  useEffect(() => () => {
    playToken.current++;
    speaker.stop();
  }, [lesson.id]);

  const playAll = async () => {
    const my = ++playToken.current;
    const from = current;
    if (from === 0) await speak(`${lesson.title}. ${lesson.intro}`, "lesson:intro");
    for (let i = from; i < lesson.steps.length; i++) {
      if (playToken.current !== my) return;
      setCurrent(i);
      const s = lesson.steps[i];
      await speak(`${t("learn.step", { n: i + 1 })}. ${s.text}${s.tip ? `. ${t("learn.tip")}: ${s.tip}` : ""}`, `lesson:${i}`);
    }
  };
  const stopAll = () => {
    playToken.current++;
    stop();
  };

  const complete = (sc?: number) => {
    stopAll();
    onComplete?.();
    setScore(sc);
    setLessonDone(skill.id, lesson.id, sc, skill.lessons.length);
    markToday();
    awardBadge("first_lesson");
    track("lesson_completed");
    const prog = useApp.getState().learning[skill.id];
    const allDone = skill.lessons.every((l) => prog?.completedLessons.includes(l.id));
    if (allDone) {
      const p = useApp.getState().profile;
      if (!p.skills.includes(skill.skill)) updateProfile({ skills: [...p.skills, skill.skill] });
      awardBadge(`skill:${skill.id}`);
      track("skill_completed");
    }
    setSkillDone(allDone);
    setPhase("done");
    celebrate(animations);
  };

  const last = current === lesson.steps.length - 1;

  return (
    <div className="glass-strong gold-edge rounded-[1.75rem] p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">{t("learn.lesson", { n: index + 1 })}</div>
          <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{lesson.title}</h2>
          <p className="mt-2 max-w-xl text-muted">{lesson.intro}</p>
        </div>
        <ListenButton size="md" text={`${lesson.title}. ${lesson.intro}`} />
      </div>

      <AnimatePresence mode="wait">
        {phase === "steps" && (
          <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button variant={playing ? "glass" : "gold"} icon={playing ? "Pause" : "Play"} onClick={playing ? stopAll : playAll}>
                {playing ? t("learn.stopLesson") : t("learn.playLesson")}
              </Button>
              <Button variant="ghost" icon="MessageCircle" onClick={() => openSaathi(t("learn.askPrompt", { lesson: lesson.title, skill: skill.title }), { skillId: skill.id, lessonId: lesson.id, screen: "learn" })}>
                {t("learn.askSaathi")}
              </Button>
            </div>

            <ol className="mt-6 grid gap-3">
              {lesson.steps.map((s, i) => {
                const active = i === current;
                const passed = i < current;
                return (
                  <motion.li
                    key={i}
                    layout
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "relative flex cursor-pointer gap-4 rounded-2xl border p-4 transition-colors sm:p-5",
                      active ? "border-gold/45 bg-gold/[0.07]" : "border-line hover:bg-glass",
                      !active && !passed && "opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border font-display text-lg italic",
                        active ? "border-gold bg-gold text-gold-ink" : passed ? "border-gold/50 text-gold" : "border-line text-subtle",
                      )}
                    >
                      {passed ? <Icon name="Check" className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("leading-relaxed", active ? "text-[1.08rem] text-fg" : "text-muted")}>{s.text}</p>
                      {s.tip && active && (
                        <p className="mt-3 flex gap-2 rounded-xl border border-line bg-glass p-3 text-sm text-muted">
                          <Icon name="Sparkles" className="mt-0.5 size-4 shrink-0 text-gold" />
                          <span>
                            <span className="font-medium text-gold">{t("learn.tip")}: </span>
                            {s.tip}
                          </span>
                        </p>
                      )}
                    </div>
                    <ListenButton text={`${s.text}${s.tip ? `. ${s.tip}` : ""}`} />
                  </motion.li>
                );
              })}
            </ol>

            {lesson.task && current === lesson.steps.length - 1 && (
              <div className="mt-5 flex gap-3 rounded-2xl border border-dashed border-line-strong p-4">
                <Icon name="Hammer" className="mt-0.5 size-5 shrink-0 text-gold" />
                <div className="flex-1">
                  <div className="eyebrow mb-1">{t("learn.task")}</div>
                  <p>{lesson.task}</p>
                </div>
                <ListenButton text={lesson.task} />
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" icon="ArrowLeft" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
                {t("learn.prevStep")}
              </Button>
              {!last ? (
                <Button variant="gold" size="lg" iconRight="ArrowRight" onClick={() => setCurrent((c) => c + 1)}>
                  {t("learn.nextStep")}
                </Button>
              ) : lesson.quiz?.length ? (
                <Button variant="gold" size="lg" iconRight="ArrowRight" onClick={() => (stopAll(), setPhase("quiz"))}>
                  {t("learn.toQuiz")}
                </Button>
              ) : (
                <Button variant="gold" size="lg" icon="Check" onClick={() => complete()}>
                  {t("learn.markDone")}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "quiz" && lesson.quiz && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
            <div className="hairline mb-8" />
            <Quiz items={lesson.quiz} onDone={(sc) => complete(sc)} />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <div className="hairline mb-8" />
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="mx-auto grid size-20 place-items-center rounded-full bg-gold text-gold-ink shadow-[0_12px_40px_-10px_var(--gold)]">
              <Icon name={skillDone ? "Award" : "Check"} className="size-9" />
            </motion.div>
            <h3 className="mt-5 font-display text-3xl">{skillDone ? t("learn.skillDone", { skill: skill.title }) : t("learn.lessonDone")}</h3>
            <div className="mt-3 flex justify-center">
              <Stars n={starsFor(score)} />
            </div>
            <p className="mt-2 text-muted">{skillDone ? t("learn.skillDoneSub") : t("learn.lessonDoneSub", { n: starsFor(score) })}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {onNext && (
                <Button variant="gold" size="lg" iconRight="ArrowRight" onClick={onNext}>
                  {t("learn.nextLesson")}
                </Button>
              )}
              <Button variant="glass" size="lg" icon="RotateCcw" onClick={() => (setPhase("steps"), setCurrent(0))}>
                {t("learn.again")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
