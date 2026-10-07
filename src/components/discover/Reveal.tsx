"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { Rich, plain } from "@/components/ui/Rich";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Pill } from "@/components/ui/Badge";
import { ListenButton } from "@/components/ui/ListenButton";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { celebrate } from "@/lib/celebrate";
import { openSaathi } from "@/lib/saathi/bus";
import { useFeedback } from "@/lib/feedback";
import type { InterestKey, SkillKey, StrengthKey } from "@/lib/taxonomy";

export function Reveal({ strengths, skills, interests }: { strengths: StrengthKey[]; skills: SkillKey[]; interests: InterestKey[] }) {
  const { t } = useT();
  const animations = useApp((s) => s.settings.animations);
  const fb = useFeedback();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const tm = setTimeout(() => {
      celebrate(animations);
      fb.success();
    }, 350 + strengths.length * 220);
    return () => clearTimeout(tm);
  }, [animations, fb, strengths.length]);

  const spoken = [
    plain(t("discover.reveal.eyebrow")),
    t("discover.reveal.strengths") + ": " + strengths.map((s) => t(`common.strengths.${s}`)).join(", "),
    skills.length ? t("discover.reveal.skills") + ": " + skills.map((s) => t(`common.skills.${s}`)).join(", ") : "",
    t("common.trust.indicatorsNote"),
  ].filter(Boolean).join(". ");

  return (
    <section>
      <div className="relative overflow-hidden rounded-[2rem] border border-line-strong p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_70%)]" aria-hidden />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <motion.div initial={{ opacity: 0, letterSpacing: "0.4em" }} animate={{ opacity: 1, letterSpacing: "0.22em" }} transition={{ duration: 1 }} className="eyebrow text-gold">
              {t("discover.reveal.eyebrow")}
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }} className="mt-3 font-display text-4xl sm:text-5xl">
              <Rich text={t("discover.reveal.title")} />
            </motion.h1>
          </div>
          <ListenButton size="md" text={spoken} />
        </div>

        <div className="relative mt-8">
          <div className="eyebrow mb-4">{t("discover.reveal.strengths")}</div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {strengths.map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.22, type: "spring", stiffness: 200, damping: 20 }}
                className="glass-strong gold-edge flex items-center gap-4 rounded-2xl p-4"
              >
                <motion.span
                  initial={{ rotate: -40, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.22, type: "spring", stiffness: 260, damping: 14 }}
                  className="grid size-12 place-items-center rounded-full bg-gold text-gold-ink shadow-[0_8px_24px_-8px_var(--gold)]"
                >
                  <Icon name="Star" className="size-6" fill="currentColor" />
                </motion.span>
                <span className="font-display text-2xl">{t(`common.strengths.${s}`)}</span>
              </motion.li>
            ))}
          </ul>

          {(skills.length > 0 || interests.length > 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + strengths.length * 0.22 }} className="mt-8 grid gap-6 sm:grid-cols-2">
              {skills.length > 0 && (
                <div>
                  <div className="eyebrow mb-3">{t("discover.reveal.skills")}</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Pill key={s} tone="gold">{t(`common.skills.${s}`)}</Pill>
                    ))}
                  </div>
                </div>
              )}
              {interests.length > 0 && (
                <div>
                  <div className="eyebrow mb-3">{t("discover.reveal.interests")}</div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((s) => (
                      <Pill key={s}>{t(`common.interests.${s}`)}</Pill>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <p className="mt-8 flex items-start gap-2 text-sm text-subtle">
            <Icon name="CircleAlert" className="mt-0.5 size-4 shrink-0" />
            {t("common.trust.indicatorsNote")}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-ok">
            <Icon name="Check" className="size-4" /> {t("discover.reveal.saved")}
          </p>
        </div>
      </div>

      <h2 className="mb-5 mt-12 font-display text-3xl">{t("discover.reveal.next")}</h2>
      <TileGrid cols={4}>
        <Tile square={false} index={0} icon="BookOpen" href="/learn" label={t("discover.reveal.learn")} sub={t("discover.reveal.learnSub")} />
        <Tile square={false} index={1} icon="Briefcase" href="/jobs" label={t("discover.reveal.jobs")} sub={t("discover.reveal.jobsSub")} />
        <Tile square={false} index={2} icon="Printer" href="/parchi" label={t("discover.reveal.parchi")} sub={t("discover.reveal.parchiSub")} />
        <Tile square={false} index={3} icon="MessageCircle" onClick={() => openSaathi(t("discover.reveal.saathiPrompt"))} label={t("discover.reveal.saathi")} sub={t("discover.reveal.saathiSub")} />
      </TileGrid>
    </section>
  );
}
