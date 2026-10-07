"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Rich, plain } from "@/components/ui/Rich";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { SaathiOrb } from "@/components/saathi/SaathiOrb";
import { JourneyTracker, useJourney } from "@/components/shell/JourneyTracker";
import { townById } from "@/lib/geo/towns";

export default function HomePage() {
  const { t, pick } = useT();
  const profile = useApp((s) => s.profile);
  const setSaathiOpen = useApp((s) => s.setSaathiOpen);
  const simple = useApp((s) => s.settings.simpleMode);
  const journey = useJourney();
  const town = townById(profile.townId);

  const next = !journey.discover
    ? { text: t("home.next.discover"), href: "/discover" }
    : !journey.learn
      ? { text: t("home.next.learn", { skill: t(`common.skills.${profile.skills[0] ?? "cooking"}`) }), href: "/learn" }
      : !journey.connect
        ? { text: t("home.next.jobs"), href: "/jobs" }
        : { text: t("home.next.parchi"), href: "/parchi" };

  const tiles = [
    { key: "discover", icon: "Search", href: "/discover" },
    { key: "learn", icon: "BookOpen", href: "/learn" },
    { key: "jobs", icon: "Briefcase", href: "/jobs" },
    { key: "parchi", icon: "IdCard", href: "/parchi" },
  ] as const;

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="pt-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="eyebrow mb-4">{profile.name ? t("home.greetingName", { name: profile.name }) : t("home.greeting")}</div>
          <h1 className="font-display text-6xl leading-[0.95] tracking-[0.08em] sm:text-7xl">
            KAAB<span className="italic text-gold">I</span>L
          </h1>
          <p className="mt-4 font-display text-2xl text-muted sm:text-[1.75rem]">
            <Rich text={t("common.brand.tagline")} />
          </p>
          <p className="mt-1.5 text-base text-muted">{t("common.brand.taglineLocal")}</p>
        </motion.div>
        <JourneyTracker className="mt-8 flex-wrap" />
      </section>

      {/* Primary question + four tiles */}
      <section aria-labelledby="q">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="q" className="font-display text-3xl sm:text-4xl">
            <Rich text={t("home.question")} />
          </h2>
          <ListenButton size="md" text={plain(t("home.question"))} />
        </div>
        <TileGrid cols={4} className={simple ? "!grid-cols-2" : undefined}>
          {tiles.map((x, i) => (
            <Tile key={x.key} index={i} size="lg" icon={x.icon} href={x.href} label={t(`home.tiles.${x.key}.label`)} sub={simple ? undefined : t(`home.tiles.${x.key}.sub`)} />
          ))}
        </TileGrid>
      </section>

      {/* Saathi CTA */}
      <section>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setSaathiOpen(true)}
          className="glass-strong gold-edge group flex w-full items-center gap-6 rounded-[1.75rem] p-6 text-left sm:p-8"
        >
          <SaathiOrb size={88} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-3xl sm:text-4xl">
              <Rich text={t("home.saathiCta").replace("KAABIL Saathi", "KAABIL *Saathi*")} />
            </div>
            <p className="mt-2 text-muted">{t("home.saathiHint")}</p>
          </div>
          <span className="hidden size-14 shrink-0 place-items-center rounded-full bg-gold text-gold-ink transition-transform group-hover:scale-105 sm:grid">
            <Icon name="Mic" className="size-6" />
          </span>
        </motion.button>
      </section>

      {/* Nearby + Next step */}
      <section className="grid gap-4 md:grid-cols-5">
        <Link href="/jobs/nearby" className="glass gold-edge group relative overflow-hidden rounded-[var(--radius-tile)] p-6 md:col-span-3">
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl border border-line text-gold">
              <Icon name="MapPin" className="size-6" />
            </span>
            <Icon name="ArrowRight" className="size-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
          </div>
          <div className="mt-8 font-display text-3xl">
            <Rich text={t("home.nearby")} />
          </div>
          <p className="mt-1 text-sm text-muted">{town ? t("home.nearbySub", { town: pick(town.name) }) : t("home.nearbyNoTown")}</p>
          <svg aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 size-48 text-gold/15" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            {[14, 26, 38, 50].map((r) => <circle key={r} cx="50" cy="50" r={r} strokeWidth="0.6" />)}
            <circle cx="50" cy="50" r="2.5" fill="currentColor" />
          </svg>
        </Link>
        <Link href={next.href} data-secondary className="glass gold-edge group rounded-[var(--radius-tile)] p-6 md:col-span-2">
          <div className="eyebrow">{t("home.nextStep")}</div>
          <p className="mt-4 font-display text-2xl leading-snug">{next.text}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
            {t("common.actions.continue")} <Icon name="ArrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      {/* Closing */}
      <section className="pb-4 pt-10 text-center">
        <div className="hairline mx-auto mb-12 max-w-md" />
        <p className="mx-auto max-w-2xl font-display text-3xl leading-snug sm:text-4xl">
          <Rich text={t("home.closing.line1")} />
        </p>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t("home.closing.line2")}</p>
        <div className="mt-10 font-display text-2xl tracking-[0.2em]">KAABIL</div>
        <p className="mt-1 text-muted">{t("home.closing.tagline")}</p>
        <div className="mt-8 text-xs uppercase tracking-[0.3em] text-subtle">{t("home.closing.motto")}</div>
        <div className="mt-2 font-display text-lg italic text-gold">{t("home.closing.flow")}</div>
      </section>
    </div>
  );
}
