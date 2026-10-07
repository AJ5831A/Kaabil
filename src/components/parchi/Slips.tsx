"use client";

import { useT } from "@/lib/i18n/client";
import { townById } from "@/lib/geo/towns";
import { formatDate, formatPayRange, formatShift } from "@/lib/format";
import { LOCALES } from "@/lib/i18n/config";
import type { PublicJob } from "@/lib/types";
import { PAPER_SPEC, ParchiSheet, SlipField, SlipFooter, SlipHeader, type Paper } from "./ParchiSheet";
import { QR } from "./QR";
import type { ProfileCode } from "./profileCode";

/** Label helpers shared by slips and the public profile page. */
export function useProfileLabels() {
  const { t, has, pick } = useT();
  const label = (ns: string, k: string) => (has(`${ns}.${k}`) ? t(`${ns}.${k}`) : k.replace(/_/g, " "));
  return {
    skill: (k: string) => label("common.skills", k),
    strength: (k: string) => label("common.strengths", k),
    category: (k: string) => label("common.jobCategories", k),
    hours: (k?: string) => (k ? label("common.hours", k) : ""),
    jobType: (k?: string) => (k ? label("common.jobType", k) : ""),
    town: (id?: string) => (id ? pick(townById(id)?.name) || id : ""),
    language: (code: string) => LOCALES.find((l) => l.code === code)?.label ?? code,
  };
}

const list = (xs: string[] | undefined, none: string) => (xs && xs.length ? xs.join(", ") : none);

export function ProfileSlip({ paper, data, serial, qrUrl, assisted, stationId }: { paper: Paper; data: ProfileCode; serial?: string; qrUrl: string; assisted?: boolean; stationId?: string }) {
  const { t, locale } = useT();
  const L = useProfileLabels();
  const none = t("parchi.slip.none");
  const spec = PAPER_SPEC[paper];
  const pref = [L.hours(data.h), L.jobType(data.jt)].filter(Boolean).join(" · ");
  return (
    <ParchiSheet paper={paper}>
      <SlipHeader title={t("parchi.slip.profileTitle")} serial={serial} />
      <div className={spec.thermal ? "mt-3" : "mt-4 flex gap-[5mm]"}>
        <div className="min-w-0 flex-1">
          <SlipField label={t("parchi.slip.kaabilId")} mono strong>{data.id}</SlipField>
          <SlipField label={t("parchi.slip.name")} strong>{data.n || none}</SlipField>
          <SlipField label={t("parchi.slip.skills")}>{list(data.s?.map(L.skill), none)}</SlipField>
          {data.st?.length ? <SlipField label={t("parchi.slip.strengths")}>{data.st.map((s) => (
            <span key={s} style={{ display: "block" }}>★ {L.strength(s)}</span>
          ))}</SlipField> : null}
          <SlipField label={t("parchi.slip.learning")}>{list(data.l?.map(L.skill), none)}</SlipField>
          <SlipField label={t("parchi.slip.experience")}>{data.e || none}</SlipField>
          <SlipField label={t("parchi.slip.preferredWork")}>{list(data.w?.map(L.category), none)}</SlipField>
          <SlipField label={t("parchi.slip.location")}>{L.town(data.t) || none}</SlipField>
          <SlipField label={t("parchi.slip.hours")}>{pref || none}</SlipField>
          <SlipField label={t("parchi.slip.languages")}>{list(data.lg?.map(L.language), none)}</SlipField>
          <SlipField label={t("parchi.slip.training")}>{list(data.tr?.map(L.skill), none)}</SlipField>
          <SlipField label={t("parchi.slip.issued")}>{formatDate(data.d, locale)}</SlipField>
        </div>
        <div className={spec.thermal ? "mt-4 flex flex-col items-center" : "flex w-[32%] shrink-0 flex-col items-center pt-1"}>
          <QR value={qrUrl} size={`${spec.qr}mm`} label={t("parchi.slip.scan")} />
          <div style={{ fontSize: "0.7em", color: "#555", marginTop: "0.5em", textAlign: "center" }}>{t("parchi.slip.scan")}</div>
        </div>
      </div>
      <SlipFooter assisted={assisted} stationId={stationId}>
        <p>{t("parchi.slip.selfReported")}</p>
        <p style={{ marginTop: "0.4em" }}>{t("parchi.slip.noGuarantee")}</p>
      </SlipFooter>
    </ParchiSheet>
  );
}

function useJobLines() {
  const { t, pick, locale } = useT();
  return (j: PublicJob) => ({
    title: j.title ? pick(j.title) : t(`common.jobCategories.${j.category}`),
    town: pick(townById(j.townId)?.name) || j.townId,
    pay: `${formatPayRange(j.payMin, j.payMax, locale)} ${t(`common.pay.${j.payPeriod}`)}`,
    hours: `${formatShift(j.shift, locale)} · ${t(`common.jobType.${j.type}`)}`,
    req: [j.skills.map((s) => t(`common.skills.${s}`)).join(", "), t(`common.experience.${j.experience}`)].join(" · "),
    verification: j.verified ? t("parchi.slip.verifiedMark") : t("parchi.slip.notVerifiedMark"),
  });
}

export function JobSlip({ paper, job, appId, serial, assisted, stationId }: { paper: Paper; job: PublicJob; appId?: string; serial?: string; assisted?: boolean; stationId?: string }) {
  const { t, pick, locale } = useT();
  const x = useJobLines()(job);
  return (
    <ParchiSheet paper={paper}>
      <SlipHeader title={t("parchi.slip.jobTitle")} serial={serial} />
      <div className="mt-4">
        <SlipField label={t("parchi.slip.job")} strong>{x.title}</SlipField>
        <SlipField label={t("parchi.slip.employer")}>{job.employer.name}</SlipField>
        <SlipField label={t("parchi.slip.place")}>{x.town}</SlipField>
        <SlipField label={t("parchi.slip.salary")} strong>{x.pay}</SlipField>
        <SlipField label={t("parchi.slip.workingHours")}>{x.hours}</SlipField>
        <SlipField label={t("parchi.slip.requirements")}>{x.req}</SlipField>
        <SlipField label={t("parchi.slip.trainingLabel")}>{t(`common.training.${job.training}`)}</SlipField>
        <SlipField label={t("parchi.slip.verification")} strong>{x.verification}</SlipField>
        <SlipField label={t("parchi.slip.applicationId")} mono strong>{appId ?? t("parchi.slip.pending")}</SlipField>
        <SlipField label={t("parchi.slip.contact")}>
          {pick(job.contactNote)}
          {job.verified && job.contact ? (
            <span style={{ display: "block", marginTop: "0.2em" }}>
              {pick(job.contact.address)}
              {job.contact.phone ? ` · ${job.contact.phone}` : ""}
            </span>
          ) : (
            <span style={{ display: "block", marginTop: "0.2em", fontStyle: "italic" }}>{t("parchi.slip.contactPending")}</span>
          )}
        </SlipField>
        <SlipField label={t("parchi.slip.issued")}>{formatDate(new Date(), locale)}</SlipField>
      </div>
      <SlipFooter assisted={assisted} stationId={stationId}>
        <p>{t("parchi.slip.noGuarantee")}</p>
      </SlipFooter>
    </ParchiSheet>
  );
}

export function OptionsSlip({ paper, jobs, appIds, serial, kaabilId, assisted, stationId }: { paper: Paper; jobs: PublicJob[]; appIds: Record<string, string>; serial?: string; kaabilId: string; assisted?: boolean; stationId?: string }) {
  const { t, locale } = useT();
  const lines = useJobLines();
  return (
    <ParchiSheet paper={paper}>
      <SlipHeader title={t("parchi.slip.optionsTitle")} serial={serial} />
      <div className="mt-3" style={{ fontSize: "0.8em", color: "#444" }}>
        {t("parchi.slip.kaabilId")}: <span style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{kaabilId}</span> · {formatDate(new Date(), locale)}
      </div>
      <ol className="mt-3" style={{ listStyle: "none", padding: 0 }}>
        {jobs.map((j, i) => {
          const x = lines(j);
          return (
            <li key={j.id} style={{ padding: "0.7em 0", borderBottom: "0.25mm solid #ccc", breakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5em", alignItems: "baseline" }}>
                <strong style={{ fontSize: "1.08em" }}>
                  {i + 1}. {x.title}
                </strong>
                <span style={{ fontSize: "0.78em", fontWeight: 700, whiteSpace: "nowrap" }}>{x.verification}</span>
              </div>
              <div style={{ marginTop: "0.2em" }}>{j.employer.name} · {x.town}</div>
              <div style={{ marginTop: "0.15em", fontWeight: 600 }}>{x.pay}</div>
              <div style={{ marginTop: "0.15em", color: "#444" }}>{x.hours}</div>
              <div style={{ marginTop: "0.25em", fontSize: "0.82em" }}>
                {t("parchi.slip.applicationId")}: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{appIds[j.id] ?? t("parchi.slip.pending")}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <SlipFooter assisted={assisted} stationId={stationId}>
        <p>{t("parchi.slip.noGuarantee")}</p>
      </SlipFooter>
    </ParchiSheet>
  );
}
