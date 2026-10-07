"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { INTERESTS, type InterestKey } from "@/lib/taxonomy";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepFrame, StepProgress } from "@/components/discover/StepFrame";
import { AttentionTask } from "@/components/discover/AttentionTask";
import { SequenceTask } from "@/components/discover/SequenceTask";
import { CoordinationTask } from "@/components/discover/CoordinationTask";
import { Reveal } from "@/components/discover/Reveal";
import { EXPERIENCE_KEYS, scoreDiscovery, type DiscoverInput, type DiscoverResult, type ExperienceKey } from "@/components/discover/scoring";
import { track } from "@/lib/track";
import { useMounted } from "@/components/learn/useMounted";

const EXP_ICON: Record<ExperienceKey, string> = {
  home_cooking: "ChefHat", stitching: "Scissors", farm: "Sprout", shop: "Store", cleaning: "Sparkles",
  repair: "Wrench", care: "HeartHandshake", craft: "Palette", packing: "Package", none: "CircleEllipsis",
};
const YEARS = [0, 1, 3, 5] as const;
const SCENARIO_COUNT = 3;

// Steps: 0 intro · 1 interests · 2 attention · 3 sequence · 4 coordination · 5..7 scenarios · 8 experience · 9 reveal
const LAST_QUESTION = 8;

const empty: DiscoverInput = { interests: [], attention: null, sequence: null, coordination: null, scenarios: [-1, -1, -1], experience: [], years: 0 };

export default function DiscoverPage() {
  const { t, tl, has } = useT();
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const awardBadge = useApp((s) => s.awardBadge);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<DiscoverInput>(empty);
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [dir, setDir] = useState(1);
  const mounted = useMounted();

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    const r = scoreDiscovery(input);
    setResult(r);
    updateProfile({
      interests: input.interests,
      strengths: r.strengths,
      skills: Array.from(new Set([...profile.skills, ...r.skills])),
      experience: input.experience.filter((e) => e !== "none").map((e) => t(`discover.experience.items.${e}`)).join(", "),
      experienceYears: input.years,
      preferredWork: profile.preferredWork.length ? profile.preferredWork : r.preferredWork,
      profileCompletedAt: new Date().toISOString(),
    });
    awardBadge("skill_profile");
    track("skill_profile_completed");
    go(9);
  };

  const toggleInterest = (k: InterestKey) =>
    setInput((s) => ({ ...s, interests: s.interests.includes(k) ? s.interests.filter((x) => x !== k) : [...s.interests, k] }));

  const toggleExp = (k: ExperienceKey) =>
    setInput((s) => {
      if (k === "none") return { ...s, experience: s.experience.includes("none") ? [] : ["none"] };
      const cur = s.experience.filter((x) => x !== "none");
      return { ...s, experience: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
    });

  const nav = (canNext: boolean, opts?: { skip?: boolean; onNext?: () => void }) => (
    <>
      <Button variant="ghost" icon="ArrowLeft" onClick={() => go(step - 1)}>
        {t("common.actions.back")}
      </Button>
      <div className="flex items-center gap-2">
        {opts?.skip && !canNext && (
          <Button variant="ghost" onClick={() => go(step + 1)}>
            {t("discover.skipActivity")}
          </Button>
        )}
        <Button variant="gold" size="lg" iconRight="ArrowRight" disabled={!canNext} onClick={opts?.onNext ?? (() => go(step + 1))}>
          {t("common.actions.continue")}
        </Button>
      </div>
    </>
  );

  const scenarioItems = Array.from({ length: SCENARIO_COUNT }, (_, i) => ({
    q: has(`discover.scenarios.items.${i}.q`) ? t(`discover.scenarios.items.${i}.q`) : "",
    options: tl(`discover.scenarios.items.${i}.options`),
  }));

  let body: React.ReactNode = null;

  if (step === 0) {
    body = (
      <div>
        <PageHeader eyebrow={t("discover.eyebrow")} title={t("discover.title")} lede={t("discover.lede")} />
        {mounted && profile.profileCompletedAt && (
          <div className="glass gold-edge mb-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-tile)] p-5">
            <span className="grid size-11 place-items-center rounded-full bg-gold text-gold-ink">
              <Icon name="Star" className="size-5" fill="currentColor" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{t("discover.existing")}</div>
              <div data-secondary className="text-sm text-muted">{t("discover.existingSub")}</div>
            </div>
            <LinkButton href="/profile" variant="glass" icon="User">
              {t("discover.viewProfile")}
            </LinkButton>
          </div>
        )}
        <div className="glass-strong gold-edge grid gap-8 rounded-[2rem] p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-end">
          <ol className="grid gap-4 sm:grid-cols-3">
            {(["Search", "Sparkles", "Star"] as const).map((ic, i) => (
              <li key={ic} className="flex items-center gap-3">
                <span className="font-display text-4xl italic text-gold">{i + 1}</span>
                <span className="text-sm text-muted">
                  {[t("discover.interests.title"), t("discover.attention.title"), t("discover.reveal.eyebrow")][i].replace(/\*/g, "")}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Button variant="gold" size="xl" iconRight="ArrowRight" onClick={() => go(1)}>
              {mounted && profile.profileCompletedAt ? t("discover.redo") : t("discover.start")}
            </Button>
            <span className="text-xs text-subtle">{t("discover.minutes")}</span>
          </div>
        </div>
        <p className="mt-6 flex items-start gap-2 text-sm text-subtle">
          <Icon name="CircleAlert" className="mt-0.5 size-4 shrink-0" />
          {t("common.trust.indicatorsNote")}
        </p>
      </div>
    );
  } else if (step === 1) {
    body = (
      <StepFrame
        title={t("discover.interests.title")}
        hint={t("discover.interests.hint")}
        footer={
          <>
            <span className="text-sm text-subtle">{input.interests.length === 0 ? t("discover.interests.need") : ""}</span>
            <Button variant="gold" size="lg" iconRight="ArrowRight" disabled={!input.interests.length} onClick={() => go(2)}>
              {t("common.actions.continue")}
            </Button>
          </>
        }
      >
        <TileGrid>
          {INTERESTS.map((it, i) => (
            <Tile key={it.key} index={i} icon={it.icon} label={t(`common.interests.${it.key}`)} selected={input.interests.includes(it.key)} onClick={() => toggleInterest(it.key)} />
          ))}
        </TileGrid>
      </StepFrame>
    );
  } else if (step === 2) {
    body = (
      <StepFrame title={t("discover.attention.title")} hint={t("discover.attention.hint")} footer={nav(!!input.attention && input.attention.correct === input.attention.total, { skip: true })}>
        <AttentionTask onResult={(attention) => setInput((s) => ({ ...s, attention }))} />
      </StepFrame>
    );
  } else if (step === 3) {
    body = (
      <StepFrame title={t("discover.sequence.title")} hint={t("discover.sequence.hint")} footer={nav(!!input.sequence, { skip: true })}>
        <SequenceTask onResult={(sequence) => setInput((s) => ({ ...s, sequence }))} />
      </StepFrame>
    );
  } else if (step === 4) {
    body = (
      <StepFrame title={t("discover.coordination.title")} hint={t("discover.coordination.hint")} footer={nav((input.coordination?.errors.length ?? 0) >= 3, { skip: true })}>
        <CoordinationTask onResult={(coordination) => setInput((s) => ({ ...s, coordination }))} />
      </StepFrame>
    );
  } else if (step >= 5 && step < 5 + SCENARIO_COUNT) {
    const si = step - 5;
    const item = scenarioItems[si];
    body = (
      <StepFrame title={t("discover.scenarios.title")} hint={t("discover.scenarios.hint")} footer={nav(input.scenarios[si] >= 0, { skip: true })}>
        <div className="glass mb-5 rounded-[var(--radius-tile)] p-5 sm:p-6">
          <div className="eyebrow mb-2">{`${si + 1} / ${SCENARIO_COUNT}`}</div>
          <p className="font-display text-2xl leading-snug sm:text-3xl">{item.q}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {item.options.map((o, oi) => (
            <Tile
              key={oi}
              index={oi}
              square={false}
              icon={(["MessageCircle", "Wrench", "LayoutGrid"] as const)[si]}
              label={o}
              selected={input.scenarios[si] === oi}
              onClick={() => {
                setInput((s) => {
                  const sc = [...s.scenarios];
                  sc[si] = oi;
                  return { ...s, scenarios: sc };
                });
                setTimeout(() => go(step + 1), 420);
              }}
            />
          ))}
        </div>
      </StepFrame>
    );
  } else if (step === LAST_QUESTION) {
    body = (
      <StepFrame title={t("discover.experience.title")} hint={t("discover.experience.hint")} footer={nav(input.experience.length > 0, { onNext: finish })}>
        <TileGrid cols={4} className="xl:grid-cols-5">
          {EXPERIENCE_KEYS.map((k, i) => (
            <Tile key={k} index={i} size="sm" square={false} icon={EXP_ICON[k]} label={t(`discover.experience.items.${k}`)} selected={input.experience.includes(k)} onClick={() => toggleExp(k)} />
          ))}
        </TileGrid>
        {input.experience.some((e) => e !== "none") && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h2 className="mb-4 font-display text-2xl">{t("discover.experience.years")}</h2>
            <TileGrid cols={4}>
              {YEARS.map((y, i) => (
                <Tile key={y} index={i} size="sm" square={false} icon="CalendarClock" label={t(`discover.experience.yearOptions.${y}`)} selected={input.years === y} onClick={() => setInput((s) => ({ ...s, years: y }))} />
              ))}
            </TileGrid>
          </motion.div>
        )}
      </StepFrame>
    );
  } else if (step === 9 && result) {
    body = <Reveal strengths={result.strengths} skills={result.skills} interests={input.interests} />;
  }

  return (
    <div>
      {step >= 1 && step <= LAST_QUESTION && <StepProgress step={step} total={LAST_QUESTION} />}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
