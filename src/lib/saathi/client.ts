"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { useApp, type ChatMsg, type SaathiBlock } from "@/lib/store/app";
import { speaker } from "@/lib/voice/speaker";
import { plain } from "@/components/ui/Rich";
import { toast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";
import type { FlowState, ProfileSummary, SaathiAction, SaathiEvent } from "./types";
import type { SaathiContext } from "./bus";

/** Ephemeral session state (not persisted): guided-flow slots, streaming status. */
export const useSaathiSession = create<{
  flow: FlowState;
  busy: boolean;
  streamingId?: string;
  engine?: "gemini" | "fallback";
  /** Bumped after Saathi finishes speaking a voice turn, so hands-free can re-listen. */
  spokenAt: number;
  set: (p: Partial<{ flow: FlowState; busy: boolean; streamingId?: string; engine?: "gemini" | "fallback"; spokenAt: number }>) => void;
}>((set) => ({ flow: {}, busy: false, spokenAt: 0, set: (p) => set(p) }));

const uid = () => Math.random().toString(36).slice(2, 10);

function profileSummary(): ProfileSummary {
  const s = useApp.getState();
  const p = s.profile;
  return {
    name: p.name || undefined,
    interests: p.interests,
    strengths: p.strengths,
    skills: p.skills,
    townId: p.townId,
    maxDistanceKm: p.maxDistanceKm,
    jobType: p.jobType,
    hoursBand: p.hoursBand,
    experience: p.experience || undefined,
    learning: Object.entries(s.learning).slice(0, 12).map(([skillId, l]) => ({ skillId: skillId.slice(0, 40), done: l.completedLessons.length })),
    savedJobIds: s.parchiJobs.slice(0, 10),
    pastSummaries: s.chatSummaries.slice(-5).map((x) => x.slice(0, 300)),
  };
}

export interface SendOptions {
  chip?: string;
  voice?: boolean;
  context?: SaathiContext;
  /** Bubble text if different from what is sent (chip labels). */
  display?: string;
}

export function useSaathiChat() {
  const router = useRouter();
  const { t } = useT();
  const chat = useApp((s) => s.chat);
  const busy = useSaathiSession((s) => s.busy);

  const applyAction = useCallback(
    (a: SaathiAction) => {
      const app = useApp.getState();
      switch (a.kind) {
        case "navigate":
          router.push(a.href);
          break;
        case "add_to_parchi":
          if (!app.parchiJobs.includes(a.jobId)) app.toggleParchiJob(a.jobId);
          toast.ok(t("saathi.reply.addedParchi"));
          break;
        case "save_profile":
          app.updateProfile(a.patch as Parameters<typeof app.updateProfile>[0]);
          break;
        case "print_parchi":
          router.push(a.which === "job" && a.jobId ? `/parchi/job/${a.jobId}` : a.which === "options" ? "/parchi/options" : "/parchi");
          break;
        case "report":
          router.push(`/jobs/${a.jobId}?report=1`);
          break;
      }
    },
    [router, t],
  );

  const send = useCallback(
    async (text: string, opts: SendOptions = {}) => {
      const msg = text.trim();
      if (!msg || useSaathiSession.getState().busy) return;
      speaker.stop();
      const app = useApp.getState();
      const userMsg: ChatMsg = { id: uid(), role: "user", text: opts.display ?? msg, at: Date.now() };
      app.pushChat(userMsg);
      const replyId = uid();
      app.pushChat({ id: replyId, role: "assistant", text: "", blocks: [], at: Date.now() });
      useSaathiSession.getState().set({ busy: true, streamingId: replyId });

      const history = useApp
        .getState()
        .chat.filter((m) => m.id !== replyId && (m.text || m.role === "user"))
        .slice(-16)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) || "…" }));

      let full = "";
      const blocks: SaathiBlock[] = [];
      const patch = () => useApp.getState().patchChat(replyId, { text: full, blocks: [...blocks] });

      try {
        const res = await fetch("/api/saathi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            locale: app.locale,
            profile: profileSummary(),
            context: opts.context,
            chip: opts.chip || undefined,
            flow: useSaathiSession.getState().flow,
          }),
        });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let e: SaathiEvent;
            try {
              e = JSON.parse(line);
            } catch {
              continue;
            }
            if (e.type === "text") {
              full += e.delta;
              patch();
            } else if (e.type === "block") {
              blocks.push(e.block);
              patch();
            } else if (e.type === "action") applyAction(e.action);
            else if (e.type === "flow") useSaathiSession.getState().set({ flow: e.flow });
            else if (e.type === "meta") useSaathiSession.getState().set({ engine: e.engine });
            else if (e.type === "error" && !full) {
              full = t("saathi.ui.error");
              patch();
            }
          }
        }
      } catch {
        full = full || t("saathi.ui.error");
        patch();
      } finally {
        full = full.trim();
        patch();
        useSaathiSession.getState().set({ busy: false, streamingId: undefined });
      }

      const { autoRead } = useApp.getState().settings;
      if (full && (opts.voice || autoRead)) {
        const s = useApp.getState().settings;
        await speaker.speak(plain(full), {
          locale: useApp.getState().locale,
          id: `msg-${replyId}`,
          rate: s.slowMode ? Math.min(s.voiceRate, 0.8) : s.voiceRate,
          voiceName: s.voiceName,
        });
        if (opts.voice) useSaathiSession.getState().set({ spokenAt: Date.now() });
      }
    },
    [applyAction, t],
  );

  const reset = useCallback(() => {
    speaker.stop();
    useApp.getState().clearChat();
    useSaathiSession.getState().set({ flow: {}, busy: false, streamingId: undefined });
  }, []);

  return { chat, busy, send, reset };
}
