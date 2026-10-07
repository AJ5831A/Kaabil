"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store/app";
import { encodeProfile, type ProfileCode } from "./profileCode";

/** Builds the compact on-slip profile summary from on-device state. */
export function useProfileCode(): { data: ProfileCode; code: string; completeness: { discover: boolean; profile: boolean; learn: boolean } } {
  const profile = useApp((s) => s.profile);
  const learning = useApp((s) => s.learning);
  return useMemo(() => {
    const learningIds = Object.entries(learning).filter(([, v]) => !v.completedAt && v.completedLessons.length > 0).map(([k]) => k);
    const trained = [...new Set([...profile.trainingCompleted, ...Object.entries(learning).filter(([, v]) => v.completedAt).map(([k]) => k)])];
    const data: ProfileCode = {
      v: 1,
      id: profile.kaabilId,
      n: profile.name.trim().slice(0, 40) || undefined,
      s: profile.skills.slice(0, 12),
      st: profile.strengths.slice(0, 9),
      l: learningIds.slice(0, 8),
      e: profile.experience.trim().slice(0, 80) || undefined,
      w: profile.preferredWork.slice(0, 4),
      t: profile.townId,
      h: profile.hoursBand,
      jt: profile.jobType,
      lg: [...new Set(profile.languages)].slice(0, 9),
      tr: trained.slice(0, 6).map((x) => x.slice(0, 40)),
      d: new Date().toISOString().slice(0, 10),
    };
    return {
      data,
      code: encodeProfile(data),
      completeness: {
        discover: profile.strengths.length > 0,
        profile: !!profile.name && !!profile.townId,
        learn: Object.keys(learning).length > 0,
      },
    };
  }, [profile, learning]);
}

/** Records a slip issue on the server and keeps its serial for this view. */
export function useSerial() {
  const [serial, setSerial] = useState<string>();
  const kiosk = useApp((s) => s.kiosk);
  const issue = async (body: { type: "profile" | "job" | "options"; jobIds?: string[] }) => {
    if (serial) return true;
    try {
      const r = await fetch("/api/parchi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, kaabilId: useApp.getState().profile.kaabilId, assisted: kiosk.active }),
      });
      if (!r.ok) return false;
      setSerial(((await r.json()) as { id: string }).id);
      return true;
    } catch {
      return false;
    }
  };
  return { serial, issue, assisted: kiosk.active, stationId: kiosk.stationId };
}
