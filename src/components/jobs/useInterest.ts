"use client";

import { useState } from "react";
import { useApp } from "@/lib/store/app";
import { track } from "@/lib/track";

/** Records "I'm interested" and returns the KBL application id (cached per job on device). */
export function useInterest(jobId: string) {
  const appId = useApp((s) => s.interested[jobId]);
  const [busy, setBusy] = useState(false);
  const register = async (): Promise<string | null> => {
    const st = useApp.getState();
    if (st.interested[jobId]) return st.interested[jobId];
    setBusy(true);
    try {
      const r = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, kaabilId: st.profile.kaabilId }),
      });
      if (!r.ok) return null;
      const { id } = (await r.json()) as { id: string };
      st.setInterested(jobId, id);
      track("job_interest");
      return id;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { appId, busy, register };
}
