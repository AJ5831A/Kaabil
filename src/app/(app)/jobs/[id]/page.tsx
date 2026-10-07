"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { categoryMeta } from "@/lib/taxonomy";
import { haversineKm, townById } from "@/lib/geo/towns";
import { celebrate } from "@/lib/celebrate";
import { openSaathi } from "@/lib/saathi/bus";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { VerificationBadge } from "@/components/ui/Badge";
import { ListenButton } from "@/components/ui/ListenButton";
import { LinkButton } from "@/components/ui/Button";
import { Rich } from "@/components/ui/Rich";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import { useFeedback } from "@/lib/feedback";
import { useJob, useJobs } from "@/components/jobs/useJobs";
import { useJobText } from "@/components/jobs/useJobText";
import { useInterest } from "@/components/jobs/useInterest";
import { ReportModal } from "@/components/jobs/ReportModal";
import { JobTile } from "@/components/jobs/JobTile";

function Fact({ icon, label, children, wide }: { icon: IconName; label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex gap-3.5 border-t border-line py-4", wide && "@xl:col-span-2")}>
      <Icon name={icon} className="mt-0.5 size-[1.1rem] shrink-0 text-gold" />
      <div className="min-w-0">
        <dt className="eyebrow !text-[0.62rem]">{label}</dt>
        <dd className="mt-1 text-[0.98rem] leading-relaxed text-fg">{children}</dd>
      </div>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, pick } = useT();
  const router = useRouter();
  const { job, loading } = useJob(id);
  const text = useJobText();
  const profile = useApp((s) => s.profile);
  const inParchi = useApp((s) => s.parchiJobs.includes(id));
  const inCompare = useApp((s) => s.compare.includes(id));
  const toggleParchi = useApp((s) => s.toggleParchiJob);
  const toggleCompare = useApp((s) => s.toggleCompare);
  const animations = useApp((s) => s.settings.animations);
  const { appId, busy, register } = useInterest(id);
  // Saathi's report_listing action links here with ?report=1.
  const searchParams = useSearchParams();
  const [reportState, setReportOpen] = useState<boolean | null>(null);
  const reportOpen = reportState ?? searchParams.get("report") === "1";
  const fb = useFeedback();

  const similarFilters = useMemo(() => (job ? { category: job.category, townId: profile.townId ?? job.townId } : null), [job, profile.townId]);
  const similar = useJobs(similarFilters);

  if (loading)
    return (
      <div className="glass relative h-96 overflow-hidden rounded-[var(--radius-tile)]" aria-busy>
        <div className="shimmer absolute inset-0 opacity-40" />
      </div>
    );

  if (!job)
    return (
      <div className="glass gold-edge rounded-[var(--radius-tile)] p-8">
        <h1 className="font-display text-4xl">{t("jobs.detail.notFound")}</h1>
        <p className="mt-2 text-muted">{t("jobs.detail.notFoundBody")}</p>
        <LinkButton href="/jobs" variant="gold" className="mt-6" icon="ArrowLeft">{t("jobs.detail.back")}</LinkButton>
      </div>
    );

  const x = text(job);
  const home = townById(profile.townId);
  const dist = home && home.id !== job.townId ? Math.round(haversineKm(home, job)) : null;
  const titleParts = x.title.split(" ");
  const displayTitle = titleParts.length > 1 ? `${titleParts.slice(0, -1).join(" ")} *${titleParts.at(-1)}*` : `*${x.title}*`;
  const speech = [
    x.title, `${t("jobs.detail.employer")}: ${job.employer.name}`, `${t("jobs.detail.location")}: ${x.town}`, `${t("jobs.detail.salary")}: ${x.pay}`,
    `${t("jobs.detail.hours")}: ${x.hours}`, x.type, `${t("jobs.detail.skills")}: ${x.skills.join(", ")}`,
    `${t("jobs.detail.experience")}: ${t(`common.experience.${job.experience}`)}`, t(`common.training.${job.training}`), x.verification,
  ].join(". ");

  const onInterested = async () => {
    const already = !!appId;
    const got = await register();
    if (!got) return toast.warn(t("jobs.detail.interestFailed"));
    if (!already) {
      fb.success();
      celebrate(animations);
    }
    toast.ok(`${t("jobs.detail.applicationId")}: ${got}`);
  };

  return (
    <div>
      <Link href="/jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
        <Icon name="ArrowLeft" className="size-4" /> {t("jobs.detail.back")}
      </Link>

      <div className="@container">
      <div className="grid gap-8 @5xl:grid-cols-[1fr_21rem]">
        {/* Main */}
        <div className="@container min-w-0">
          <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-5">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-line-strong bg-gold/10 text-gold">
              <Icon name={categoryMeta(job.category).icon} className="size-8" />
            </span>
            <div className="min-w-0 flex-1">
              <VerificationBadge verified={job.verified} />
              <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl">
                <Rich text={displayTitle} />
              </h1>
              <p className="mt-2 text-muted">
                {job.employer.name} · {x.town}
              </p>
            </div>
            <ListenButton size="md" text={speech} />
          </motion.header>

          <div className="glass gold-edge mt-8 rounded-[var(--radius-tile)] p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow">{t("jobs.detail.salary")}</div>
                <div className="mt-1 font-display text-4xl text-gold">{x.pay}</div>
              </div>
              <div className="text-right text-sm text-muted">
                <div>{x.type}</div>
                <div>{x.hours}</div>
              </div>
            </div>
            <p className="mt-6 text-[1.02rem] leading-relaxed">{pick(job.description)}</p>

            <dl className="mt-6 grid @xl:grid-cols-2 @xl:gap-x-8">
              <Fact icon="Building2" label={t("jobs.detail.employer")}>{job.employer.name}</Fact>
              <Fact icon="MapPin" label={t("jobs.detail.location")}>
                {x.town}
                {dist != null && home && <span className="text-muted"> · {t("jobs.detail.away", { n: dist, town: pick(home.name) })}</span>}
              </Fact>
              <Fact icon="Clock" label={t("jobs.detail.hours")}>{x.hours} · {t(`common.hours.${job.hoursBand}`)}</Fact>
              <Fact icon="Briefcase" label={t("jobs.detail.type")}>{x.type}</Fact>
              <Fact icon="Wrench" label={t("jobs.detail.skills")}>{x.skills.join(", ")}</Fact>
              <Fact icon="Award" label={t("jobs.detail.experience")}>{t(`common.experience.${job.experience}`)}</Fact>
              <Fact icon="GraduationCap" label={t("jobs.detail.training")}>{t(`common.training.${job.training}`)}</Fact>
              <Fact icon="Users" label={t("jobs.detail.openings")}>{t("jobs.detail.openingsN", { n: job.openings })}</Fact>
              <Fact icon="CalendarClock" label={t("jobs.detail.joining")} wide>{pick(job.joining)}</Fact>
              <Fact icon="Phone" label={t("jobs.detail.contact")} wide>
                <span className="block">{pick(job.contactNote)}</span>
                {job.verified && job.contact ? (
                  <span className="mt-1 block text-muted">
                    {pick(job.contact.address)}
                    {job.contact.phone && <> · <span className="font-mono">{job.contact.phone}</span></>}
                  </span>
                ) : (
                  <span className="mt-1 block text-sm text-warn">{t("jobs.detail.contactHidden")}</span>
                )}
              </Fact>
              <Fact icon={job.verified ? "ShieldCheck" : "ShieldAlert"} label={t("jobs.detail.verification")} wide>
                <VerificationBadge verified={job.verified} />
                <span className="mt-2 block text-sm text-muted">{job.verified ? t("common.trust.verifiedExplain") : t("common.trust.notVerifiedExplain")}</span>
              </Fact>
            </dl>
          </div>

          {/* Actions as big tiles */}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-2xl">{t("jobs.detail.actions")}</h2>
            <TileGrid cols={3}>
              <Tile
                index={0}
                icon={appId ? "BadgeCheck" : "HandHelping"}
                label={appId ? t("jobs.detail.interestedDone") : t("jobs.detail.interested")}
                sub={appId ? `${t("jobs.detail.applicationId")}: ${appId}` : t("jobs.detail.interestedSub")}
                selected={!!appId}
                disabled={busy}
                onClick={onInterested}
              />
              <Tile index={1} icon="Printer" label={t("jobs.detail.printParchi")} sub={t("jobs.detail.printParchiSub")} onClick={() => router.push(`/parchi/job/${job.id}`)} />
              <Tile
                index={2}
                icon="IdCard"
                label={inParchi ? t("jobs.detail.inParchi") : t("jobs.detail.addParchi")}
                sub={t("jobs.detail.addParchiSub")}
                selected={inParchi}
                onClick={() => {
                  toggleParchi(job.id);
                  toast.ok(inParchi ? t("jobs.card.removed") : t("jobs.card.added"));
                }}
              />
              <Tile index={3} icon="Scale" label={inCompare ? t("jobs.detail.inCompare") : t("jobs.detail.compare")} sub={t("jobs.detail.compareSub")} selected={inCompare} onClick={() => toggleCompare(job.id)} />
              <Tile index={4} icon="MessageCircle" label={t("jobs.detail.askSaathi")} sub={t("jobs.detail.askSaathiSub")} onClick={() => openSaathi(t("jobs.detail.askPrompt", { title: x.title, employer: job.employer.name }), { jobId: job.id, screen: "job" })} />
              <Tile index={5} icon="Flag" label={t("jobs.detail.report")} sub={t("jobs.detail.reportSub")} onClick={() => setReportOpen(true)} />
            </TileGrid>
          </section>
        </div>

        {/* Sticky side panel */}
        <aside className="@5xl:sticky @5xl:top-24 @5xl:self-start">
          <div className="glass-strong gold-edge rounded-[var(--radius-tile)] p-6">
            {appId ? (
              <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/10 p-4">
                <div className="eyebrow">{t("jobs.detail.applicationId")}</div>
                <div className="mt-1 font-mono text-2xl tracking-wider text-gold">{appId}</div>
                <p className="mt-2 text-xs text-muted">{t("jobs.detail.interestedMsg")}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <button onClick={onInterested} disabled={busy} className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-gold px-6 font-medium text-gold-ink transition hover:brightness-110 disabled:opacity-50">
                <Icon name={appId ? "BadgeCheck" : "HandHelping"} className="size-5" />
                {appId ? t("jobs.detail.interestedDone") : t("jobs.detail.interested")}
              </button>
              <LinkButton href={`/parchi/job/${job.id}`} icon="Printer" size="lg">{t("jobs.detail.printParchi")}</LinkButton>
            </div>
            <div className="hairline my-6" />
            <h3 className="font-display text-xl">{t("jobs.trustPanel.title")}</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              <li className="flex gap-2.5"><Icon name="Wallet" className="mt-0.5 size-4 shrink-0 text-warn" />{t("jobs.trustPanel.neverPay")}</li>
              <li className="flex gap-2.5"><Icon name="Route" className="mt-0.5 size-4 shrink-0 text-gold" />{t("jobs.trustPanel.noGuarantee")}</li>
              <li className="flex gap-2.5"><Icon name="Flag" className="mt-0.5 size-4 shrink-0 text-gold" />
                <button onClick={() => setReportOpen(true)} className="text-left underline decoration-line-strong underline-offset-4 hover:text-fg">{t("jobs.trustPanel.report")}</button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
      </div>

      {similar.items.filter((j) => j.id !== job.id).length > 0 && (
        <section className="@container mt-14">
          <h2 className="mb-5 font-display text-3xl"><Rich text={t("jobs.detail.similar")} /></h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 @xl:grid-cols-3 @4xl:grid-cols-4">
            {similar.items.filter((j) => j.id !== job.id).slice(0, 4).map((j, i) => <JobTile key={j.id} job={j} index={i} />)}
          </div>
        </section>
      )}

      <ReportModal jobId={job.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
