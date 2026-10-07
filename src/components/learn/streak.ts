"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useApp } from "@/lib/store/app";

/**
 * Learning days, tied to the current KAABIL ID so a kiosk "reset session"
 * (which issues a new ID) automatically starts from zero.
 */
const useDays = create<{ owner: string; days: string[]; mark: (owner: string) => void }>()(
  persist(
    (set, get) => ({
      owner: "",
      days: [],
      mark: (owner) => {
        const today = new Date().toISOString().slice(0, 10);
        const days = get().owner === owner ? get().days : [];
        set({ owner, days: days.includes(today) ? days : [...days, today].slice(-60) });
      },
    }),
    { name: "kaabil-learn-days", storage: createJSONStorage(() => localStorage) },
  ),
);

export function computeStreak(days: string[], today = new Date()): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  // A streak stays alive if the latest day is today or yesterday.
  if (!set.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function useStreak() {
  const id = useApp((s) => s.profile.kaabilId);
  const owner = useDays((s) => s.owner);
  const days = useDays((s) => s.days);
  const mark = useDays((s) => s.mark);
  return { streak: computeStreak(owner === id ? days : []), markToday: () => mark(id) };
}
