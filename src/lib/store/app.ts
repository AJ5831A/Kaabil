"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/lib/i18n/config";
import type { HoursBand, InterestKey, JobType, SkillKey, StrengthKey } from "@/lib/taxonomy";

/**
 * All personal data lives on the user's device (anonymous KAABIL ID).
 * Nothing here is sent to the server except what a feature explicitly needs.
 */

export interface Profile {
  kaabilId: string;
  name: string;
  interests: InterestKey[];
  strengths: StrengthKey[];
  /** Skills the person says they already have. */
  skills: SkillKey[];
  experience: string;
  experienceYears?: number;
  preferredWork: string[]; // job category keys
  townId?: string;
  maxDistanceKm: number;
  jobType?: JobType;
  hoursBand?: HoursBand;
  languages: Locale[];
  trainingCompleted: string[];
  profileCompletedAt?: string;
}

export interface LessonProgress {
  completedLessons: string[];
  quiz: Record<string, number>; // lessonId -> score 0..1
  startedAt: string;
  completedAt?: string;
}

export interface Settings {
  theme: "dark" | "light";
  simpleMode: boolean;
  animations: boolean;
  sound: boolean;
  haptics: boolean;
  voiceRate: number; // 0.6 – 1.4
  slowMode: boolean;
  voiceName?: string;
  autoRead: boolean;
  handsFree: boolean;
  useCloudVoice: boolean;
}

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Rich blocks rendered inline (job tiles, chips, etc.). */
  blocks?: SaathiBlock[];
  at: number;
}

export type SaathiBlock =
  | { kind: "jobs"; jobIds: string[]; title?: string }
  | { kind: "chips"; options: { label: string; value: string }[] }
  | { kind: "skills"; skills: SkillKey[] }
  | { kind: "training"; ids: string[] }
  | { kind: "stations"; ids: string[] }
  | { kind: "compare"; jobIds: string[] }
  | { kind: "nav"; href: string; label: string };

export interface KioskState {
  active: boolean;
  stationId?: string;
  assisted: boolean;
}

interface AppState {
  hydrated: boolean;
  locale: Locale;
  localeChosen: boolean;
  settings: Settings;
  profile: Profile;
  learning: Record<string, LessonProgress>;
  /** Jobs added to "My Job Options" parchi. */
  parchiJobs: string[];
  /** jobId -> application id */
  interested: Record<string, string>;
  compare: string[];
  chat: ChatMsg[];
  chatSummaries: string[];
  kiosk: KioskState;
  saathiOpen: boolean;
  badges: string[];

  setLocale: (l: Locale) => void;
  updateSettings: (s: Partial<Settings>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setLessonDone: (skillId: string, lessonId: string, score?: number, totalLessons?: number) => void;
  toggleParchiJob: (id: string) => void;
  clearParchiJobs: () => void;
  setInterested: (jobId: string, appId: string) => void;
  toggleCompare: (id: string) => void;
  pushChat: (m: ChatMsg) => void;
  patchChat: (id: string, patch: Partial<ChatMsg>) => void;
  clearChat: () => void;
  setKiosk: (k: Partial<KioskState>) => void;
  setSaathiOpen: (o: boolean) => void;
  awardBadge: (b: string) => void;
  /** Wipe everything (kiosk session end / "forget me"). */
  resetSession: () => void;
}

export function newKaabilId() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = (n: number) => Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
  return `KB-${r(4)}-${r(4)}`;
}

const defaultSettings: Settings = {
  theme: "dark",
  simpleMode: false,
  animations: true,
  sound: false,
  haptics: true,
  voiceRate: 1,
  slowMode: false,
  autoRead: false,
  handsFree: false,
  useCloudVoice: true,
};

// ID is assigned on the client after hydration so server and client markup match.
const freshProfile = (kaabilId = ""): Profile => ({
  kaabilId,
  name: "",
  interests: [],
  strengths: [],
  skills: [],
  experience: "",
  preferredWork: [],
  maxDistanceKm: 25,
  languages: [],
  trainingCompleted: [],
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      locale: "hi",
      localeChosen: false,
      settings: defaultSettings,
      profile: freshProfile(),
      learning: {},
      parchiJobs: [],
      interested: {},
      compare: [],
      chat: [],
      chatSummaries: [],
      kiosk: { active: false, assisted: false },
      saathiOpen: false,
      badges: [],

      setLocale: (l) => {
        document.cookie = `kaabil_locale=${l}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = l;
        const langs = get().profile.languages;
        set({
          locale: l,
          localeChosen: true,
          profile: { ...get().profile, languages: langs.includes(l) ? langs : [l, ...langs] },
        });
      },
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      updateProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setLessonDone: (skillId, lessonId, score, totalLessons) => {
        const cur = get().learning[skillId] ?? { completedLessons: [], quiz: {}, startedAt: new Date().toISOString() };
        const completed = cur.completedLessons.includes(lessonId) ? cur.completedLessons : [...cur.completedLessons, lessonId];
        const done = totalLessons != null && completed.length >= totalLessons;
        set({
          learning: {
            ...get().learning,
            [skillId]: {
              ...cur,
              completedLessons: completed,
              quiz: score != null ? { ...cur.quiz, [lessonId]: score } : cur.quiz,
              completedAt: done ? cur.completedAt ?? new Date().toISOString() : cur.completedAt,
            },
          },
        });
      },
      toggleParchiJob: (id) => {
        const cur = get().parchiJobs;
        set({ parchiJobs: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-8) });
      },
      clearParchiJobs: () => set({ parchiJobs: [] }),
      setInterested: (jobId, appId) => set({ interested: { ...get().interested, [jobId]: appId } }),
      toggleCompare: (id) => {
        const cur = get().compare;
        set({ compare: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3) });
      },
      pushChat: (m) => set({ chat: [...get().chat, m].slice(-60) }),
      patchChat: (id, patch) => set({ chat: get().chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      clearChat: () => {
        const userTurns = get().chat.filter((m) => m.role === "user").map((m) => m.text);
        const summary = userTurns.slice(-4).join(" · ").slice(0, 240);
        set({ chat: [], chatSummaries: summary ? [...get().chatSummaries, summary].slice(-5) : get().chatSummaries });
      },
      setKiosk: (k) => set({ kiosk: { ...get().kiosk, ...k } }),
      setSaathiOpen: (o) => set({ saathiOpen: o }),
      awardBadge: (b) => {
        if (!get().badges.includes(b)) set({ badges: [...get().badges, b] });
      },
      resetSession: () =>
        set({
          profile: freshProfile(newKaabilId()),
          learning: {},
          parchiJobs: [],
          interested: {},
          compare: [],
          chat: [],
          chatSummaries: [],
          badges: [],
          localeChosen: false,
          saathiOpen: false,
        }),
    }),
    {
      name: "kaabil",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      partialize: ({ hydrated: _h, saathiOpen: _s, ...rest }) => rest,
      // localStorage rehydrates synchronously inside create(), before `useApp` is
      // assigned — defer the flag. (zustand serves getInitialState() during React
      // hydration, so this never causes a hydration mismatch.)
      onRehydrateStorage: () => () => {
        setTimeout(() => {
          const s = useApp.getState();
          useApp.setState({ hydrated: true, ...(s.profile.kaabilId ? {} : { profile: { ...s.profile, kaabilId: newKaabilId() } }) });
        }, 0);
      },
    },
  ),
);
