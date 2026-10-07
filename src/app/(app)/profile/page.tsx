"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS, type SkillKey } from "@/lib/taxonomy";
import { LOCALES } from "@/lib/i18n/config";
import { TOWNS, nearestTown, townById } from "@/lib/geo/towns";
import type { TrainingProgramme } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Badge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import { IdentityCard } from "@/components/profile/IdentityCard";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { useLearnContent } from "@/content/learn/client";
import { useMounted } from "@/components/learn/useMounted";

type Editor = null | "name" | "skills" | "experience" | "work" | "location" | "languages" | "training";

const SKILL_ICON: Record<SkillKey, IconName> = {
  cooking: "ChefHat", cleaning: "Sparkles", sewing: "Scissors", repair: "Wrench", gardening: "Sprout", plant_care: "Wheat",
  packing: "Package", sales: "Store", digital_basics: "Keyboard", caregiving: "HeartHandshake", tools: "Hammer",
  craft: "Palette", driving: "Navigation", customer_service: "MessageCircle",
};
const HOURS_ICON: Record<string, IconName> = { morning: "Sun", day: "Clock", evening: "Moon", flexible: "CalendarClock" };
const DISTANCES = [5, 10, 25, 50];

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function ProfilePage() {
  const { t, pick } = useT();
  const p = useApp((s) => s.profile);
  const learning = useApp((s) => s.learning);
  const badges = useApp((s) => s.badges);
  const update = useApp((s) => s.updateProfile);
  const { skills: learnSkills } = useLearnContent();
  const [editor, setEditor] = useState<Editor>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [expDraft, setExpDraft] = useState("");
  const [locating, setLocating] = useState(false);
  const [training, setTraining] = useState<TrainingProgramme[]>([]);

  useEffect(() => {
    fetch("/api/training")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setTraining(d.items ?? []))
      .catch(() => {});
  }, []);

  const open = (e: Editor) => {
    if (e === "name") setNameDraft(p.name);
    if (e === "experience") setExpDraft(p.experience);
    setEditor(e);
  };
  const close = () => setEditor(null);

  const town = townById(p.townId);
  const learningRows = learnSkills
    .map((s) => ({ s, done: learning[s.id]?.completedLessons.filter((id) => s.lessons.some((l) => l.id === id)).length ?? 0 }))
    .filter((r) => r.done > 0);

  const locate = () => {
    if (!("geolocation" in navigator)) return toast.warn(t("profile.locationFailed"));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tw = nearestTown({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        update({ townId: tw.id });
        setLocating(false);
        toast.ok(t("profile.located", { town: pick(tw.name) }));
      },
      () => {
        setLocating(false);
        toast.warn(t("profile.locationFailed"));
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const shareText = () =>
    [
      `${t("profile.shareTitle")} — ${p.name || ""} (${p.kaabilId})`.trim(),
      p.strengths.length ? `${t("profile.sections.strengths")}: ${p.strengths.map((s) => t(`common.strengths.${s}`)).join(", ")}` : "",
      p.skills.length ? `${t("profile.sections.skills")}: ${p.skills.map((s) => t(`common.skills.${s}`)).join(", ")}` : "",
      p.preferredWork.length ? `${t("profile.sections.work")}: ${p.preferredWork.map((w) => t(`common.jobCategories.${w}`)).join(", ")}` : "",
      town ? `${t("profile.sections.location")}: ${pick(town.name)}` : "",
      "KAABIL — हर हुनर को मिले सही दिशा",
    ].filter(Boolean).join("\n");

  const share = async () => {
    const text = shareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: t("profile.shareTitle"), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.ok(t("profile.shared"));
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.warn(t("profile.shareFailed"));
    }
  };

  const badgeLabel = (b: string) => {
    if (b.startsWith("skill:")) {
      const s = learnSkills.find((x) => x.id === b.slice(6));
      return t("profile.badgeNames.skill", { skill: s?.title ?? b.slice(6) });
    }
    return t(`profile.badgeNames.${b}`);
  };
  const mounted = useMounted();
  const knownBadges = badges.filter((b) => b.startsWith("skill:") || ["skill_profile", "first_lesson"].includes(b));

  if (!mounted) return <div className="glass h-96 overflow-hidden rounded-[2rem]"><div className="shimmer h-full opacity-40" /></div>;

  return (
    <div>
      <PageHeader
        eyebrow={t("profile.eyebrow")}
        title={t("profile.title")}
        lede={t("profile.lede")}
        actions={
          <>
            <Button variant="glass" icon="Send" onClick={share} className="hidden sm:inline-flex">
              {t("profile.share")}
            </Button>
            <LinkButton href="/parchi" variant="gold" icon="Printer">
              {t("profile.print")}
            </LinkButton>
          </>
        }
      />

      <div className="@container">
      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="@4xl:sticky @4xl:top-24 @4xl:self-start">
          <IdentityCard onEditName={() => open("name")} />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
            <Button variant="glass" icon="Send" onClick={share}>
              {t("profile.share")}
            </Button>
          </div>
          {!p.strengths.length && (
            <LinkButton href="/discover" variant="gold" size="lg" icon="Search" className="mt-4 w-full">
              {t("profile.discoverCta")}
            </LinkButton>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-1 @6xl:grid-cols-2">
            <ProfileSection icon="Star" title={t("profile.sections.skills")} empty={t("profile.empty.skills")} onEdit={() => open("skills")} listen={p.skills.map((s) => t(`common.skills.${s}`)).join(", ")}>
              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.skills.map((s) => (
                    <Pill key={s} tone="gold">{t(`common.skills.${s}`)}</Pill>
                  ))}
                </div>
              )}
            </ProfileSection>

            <ProfileSection icon="BookOpen" title={t("profile.sections.learning")} empty={t("profile.empty.learning")} listen={learningRows.map((r) => r.s.title).join(", ")}>
              {learningRows.length > 0 ? (
                <ul className="grid gap-2">
                  {learningRows.map(({ s, done }) => (
                    <li key={s.id} className="flex items-center gap-3 text-sm">
                      <Icon name={s.icon} className="size-4 text-gold" />
                      <span className="flex-1">{s.title}</span>
                      {done >= s.lessons.length ? (
                        <Pill tone="ok"><Icon name="Check" className="size-3.5" /> {t("profile.learned")}</Pill>
                      ) : (
                        <span className="text-muted">{t("profile.inProgress", { done, total: s.lessons.length })}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <LinkButton href="/learn" variant="ghost" icon="ArrowRight" className="-ml-3">
                  {t("profile.learnCta")}
                </LinkButton>
              )}
            </ProfileSection>
          </div>

          <ProfileSection
            icon="Briefcase"
            title={t("profile.sections.experience")}
            empty={t("profile.empty.experience")}
            summary={[p.experience, p.experienceYears ? t("profile.years", { n: p.experienceYears }) : ""].filter(Boolean).join(" · ") || undefined}
            onEdit={() => open("experience")}
          />

          <ProfileSection icon="LayoutGrid" title={t("profile.sections.work")} empty={t("profile.empty.work")} onEdit={() => open("work")} listen={p.preferredWork.map((w) => t(`common.jobCategories.${w}`)).join(", ")}>
            {p.preferredWork.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.preferredWork.map((w) => (
                  <Pill key={w}>{t(`common.jobCategories.${w}`)}</Pill>
                ))}
              </div>
            )}
          </ProfileSection>

          <ProfileSection icon="MapPin" title={t("profile.sections.location")} empty={t("profile.empty.location")} summary={town ? `${pick(town.name)} · ${town.district}` : undefined} onEdit={() => open("location")} />

          <ProfileSection icon="Clock" title={t("profile.sections.hours")} summary={p.hoursBand ? t(`common.hours.${p.hoursBand}`) : t("profile.empty.hours")}>
            <div className="grid grid-cols-2 gap-3 @md:grid-cols-4">
              {HOURS_BANDS.map((h, i) => (
                <Tile key={h} index={i} size="sm" square={false} className="!min-h-28" icon={HOURS_ICON[h]} label={t(`common.hours.${h}`)} selected={p.hoursBand === h} onClick={() => update({ hoursBand: p.hoursBand === h ? undefined : h })} />
              ))}
            </div>
          </ProfileSection>

          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-1 @6xl:grid-cols-2">
            <ProfileSection icon="CalendarClock" title={t("profile.sections.jobType")} summary={p.jobType ? t(`common.jobType.${p.jobType}`) : t("profile.empty.jobType")}>
              <TileGrid cols={2}>
                {JOB_TYPES.map((jt, i) => (
                  <Tile key={jt} index={i} size="sm" square={false} className="!min-h-28" icon={jt === "full_time" ? "Sun" : "Timer"} label={t(`common.jobType.${jt}`)} selected={p.jobType === jt} onClick={() => update({ jobType: p.jobType === jt ? undefined : jt })} />
                ))}
              </TileGrid>
            </ProfileSection>
            <ProfileSection icon="Route" title={t("profile.sections.distance")} summary={t("profile.km", { n: p.maxDistanceKm })}>
              <div className="grid grid-cols-4 gap-2">
                {DISTANCES.map((d) => (
                  <button
                    key={d}
                    onClick={() => update({ maxDistanceKm: d })}
                    aria-pressed={p.maxDistanceKm === d}
                    className={cn("glass h-16 rounded-2xl text-center transition-colors", p.maxDistanceKm === d ? "!border-gold/50 bg-gold/10 text-gold" : "hover:bg-glass-2")}
                  >
                    <span className="font-display text-2xl">{d}</span>
                    <span className="ml-1 text-xs text-muted">km</span>
                  </button>
                ))}
              </div>
            </ProfileSection>
          </div>

          <ProfileSection icon="Languages" title={t("profile.sections.languages")} empty={t("profile.empty.languages")} onEdit={() => open("languages")} summary={p.languages.length ? p.languages.map((l) => LOCALES.find((x) => x.code === l)?.label).join(" · ") : undefined} />

          <ProfileSection
            icon="GraduationCap"
            title={t("profile.sections.training")}
            empty={t("profile.empty.training")}
            onEdit={() => open("training")}
            summary={p.trainingCompleted.length ? p.trainingCompleted.map((id) => { const tr = training.find((x) => x.id === id); return tr ? pick(tr.name) : null; }).filter(Boolean).join(" · ") || undefined : undefined}
          />

          <ProfileSection icon="Award" title={t("profile.sections.badges")} empty={t("profile.empty.badges")} listen={knownBadges.map(badgeLabel).join(", ")}>
            {knownBadges.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {knownBadges.map((b) => (
                  <li key={b} className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-sm text-gold">
                    <Icon name={b.startsWith("skill:") ? "Award" : "Star"} className="size-4" fill={b.startsWith("skill:") ? "none" : "currentColor"} />
                    {badgeLabel(b)}
                  </li>
                ))}
              </ul>
            )}
          </ProfileSection>
        </div>
      </div>
      </div>

      {/* Editors */}
      <Modal open={editor === "name"} onClose={close} title={t("profile.nameOptional")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ name: nameDraft.trim().slice(0, 40) });
            toast.ok(t("profile.saved"));
            close();
          }}
        >
          <label className="block">
            <span className="sr-only">{t("profile.nameOptional")}</span>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={40}
              autoComplete="given-name"
              placeholder={t("profile.namePlaceholder")}
              className="glass h-14 w-full rounded-2xl px-5 text-lg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </label>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <Icon name="Lock" className="mt-0.5 size-4 shrink-0 text-gold" /> {t("profile.nameHint")}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>{t("common.actions.cancel")}</Button>
            <Button type="submit" variant="gold">{t("common.actions.save")}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editor === "experience"} onClose={close} title={t("profile.sections.experience")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ experience: expDraft.trim().slice(0, 300) });
            toast.ok(t("profile.saved"));
            close();
          }}
        >
          <label className="mb-2 block text-sm text-muted" htmlFor="exp">{t("profile.experienceLabel")}</label>
          <textarea
            id="exp"
            value={expDraft}
            onChange={(e) => setExpDraft(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder={t("profile.experiencePlaceholder")}
            className="glass w-full rounded-2xl p-4 outline-none placeholder:text-subtle focus:border-line-strong"
          />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[0, 1, 3, 5].map((y) => (
              <button key={y} type="button" onClick={() => update({ experienceYears: y })} aria-pressed={(p.experienceYears ?? 0) === y} className={cn("glass h-14 rounded-2xl text-sm", (p.experienceYears ?? 0) === y ? "!border-gold/50 text-gold" : "hover:bg-glass-2")}>
                {y === 0 ? "< 1" : `${y}+`}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>{t("common.actions.cancel")}</Button>
            <Button type="submit" variant="gold">{t("common.actions.save")}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editor === "skills"} onClose={close} title={t("profile.sections.skills")} wide>
        <TileGrid cols={4}>
          {SKILLS.map((s, i) => (
            <Tile key={s} index={i} size="sm" square={false} className="!min-h-28" icon={SKILL_ICON[s]} label={t(`common.skills.${s}`)} selected={p.skills.includes(s)} onClick={() => update({ skills: toggle(p.skills, s) })} />
          ))}
        </TileGrid>
        <div className="mt-6 flex justify-end"><Button variant="gold" onClick={close}>{t("common.actions.done")}</Button></div>
      </Modal>

      <Modal open={editor === "work"} onClose={close} title={t("profile.sections.work")} wide>
        <TileGrid cols={4}>
          {JOB_CATEGORIES.map((c, i) => (
            <Tile key={c.key} index={i} size="sm" square={false} className="!min-h-28" icon={c.icon} label={t(`common.jobCategories.${c.key}`)} selected={p.preferredWork.includes(c.key)} onClick={() => update({ preferredWork: toggle(p.preferredWork, c.key) })} />
          ))}
        </TileGrid>
        <div className="mt-6 flex justify-end"><Button variant="gold" onClick={close}>{t("common.actions.done")}</Button></div>
      </Modal>

      <Modal open={editor === "location"} onClose={close} title={t("profile.sections.location")} wide>
        <Button variant="glass" icon="Navigation" onClick={locate} disabled={locating} className="mb-5">
          {locating ? t("profile.locating") : t("profile.useLocation")}
        </Button>
        <TileGrid cols={4}>
          {TOWNS.map((tw, i) => (
            <Tile key={tw.id} index={i} size="sm" square={false} className="!min-h-28" icon="MapPin" label={pick(tw.name)} sub={tw.district} selected={p.townId === tw.id} onClick={() => update({ townId: tw.id })} />
          ))}
        </TileGrid>
        <p className="mt-4 flex items-start gap-2 text-sm text-subtle">
          <Icon name="CircleAlert" className="mt-0.5 size-4 shrink-0" /> {t("profile.pilotNote")}
        </p>
        <div className="mt-6 flex justify-end"><Button variant="gold" onClick={close}>{t("common.actions.done")}</Button></div>
      </Modal>

      <Modal open={editor === "languages"} onClose={close} title={t("profile.sections.languages")} wide>
        <TileGrid cols={3}>
          {LOCALES.map((l, i) => (
            <Tile key={l.code} index={i} size="sm" square={false} className="!min-h-24" glyph={<Icon name="Languages" className="size-5" />} label={l.label} sub={l.english} listen={false} selected={p.languages.includes(l.code)} onClick={() => update({ languages: toggle(p.languages, l.code) })} />
          ))}
        </TileGrid>
        <div className="mt-6 flex justify-end"><Button variant="gold" onClick={close}>{t("common.actions.done")}</Button></div>
      </Modal>

      <Modal open={editor === "training"} onClose={close} title={t("profile.sections.training")} wide>
        <p className="mb-4 text-sm text-muted">{t("profile.trainingHint")}</p>
        <ul className="grid gap-2">
          {training.map((tr) => {
            const on = p.trainingCompleted.includes(tr.id);
            return (
              <li key={tr.id}>
                <button
                  onClick={() => update({ trainingCompleted: toggle(p.trainingCompleted, tr.id) })}
                  aria-pressed={on}
                  className={cn("glass flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 py-3 text-left", on ? "!border-gold/50" : "hover:bg-glass-2")}
                >
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg border", on ? "border-gold bg-gold text-gold-ink" : "border-line")}>
                    {on && <Icon name="Check" className="size-4" />}
                  </span>
                  <span className="flex-1">
                    <span className="block">{pick(tr.name)}</span>
                    <span className="block text-sm text-muted">{tr.provider}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex justify-end"><Button variant="gold" onClick={close}>{t("common.actions.done")}</Button></div>
      </Modal>
    </div>
  );
}
