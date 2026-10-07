"use client";

import { create } from "zustand";
import { useApp } from "@/lib/store/app";

export interface SaathiContext {
  jobId?: string;
  skillId?: string;
  lessonId?: string;
  screen?: string;
}

/** Pending request for the Saathi UI to pick up (e.g. "Ask Saathi" on a job page). */
export const useSaathiBus = create<{ pending: { prompt?: string; context?: SaathiContext; at: number } | null; clear: () => void }>((set) => ({
  pending: null,
  clear: () => set({ pending: null }),
}));

/** Open Saathi (panel on desktop, sheet on mobile), optionally sending a prompt with context. */
export function openSaathi(prompt?: string, context?: SaathiContext) {
  useSaathiBus.setState({ pending: { prompt, context, at: Date.now() } });
  useApp.getState().setSaathiOpen(true);
}
