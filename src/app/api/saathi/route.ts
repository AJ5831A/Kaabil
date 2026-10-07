import { SaathiRequestSchema, type SaathiEvent } from "@/lib/saathi/types";
import { runFallback } from "@/lib/saathi/fallback";
import { runGemini } from "@/lib/saathi/engine";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";
import { hasGemini } from "@/lib/server/gemini";
import { getPublicJob, listStations, listTraining, logEvent, searchJobs } from "@/lib/db/repo";
import { englishMessages, loadMessages } from "@/messages";
import { translate } from "@/lib/i18n/format";
import { getLearnSkills } from "@/content/learn";
import type { Locale } from "@/lib/i18n/config";

export const maxDuration = 30;

const GEMINI_TIMEOUT_MS = 20_000;

/**
 * POST /api/saathi — streams NDJSON SaathiEvents.
 * Gemini (tool calling) when GEMINI_API_KEY is set; deterministic fallback otherwise or on failure.
 */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "saathi", 30);
  if (limited) return limited;
  const parsed = await parseJson(req, SaathiRequestSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;
  const locale = body.locale as Locale;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let emittedAny = false;
      const emit = (e: SaathiEvent) => {
        if (closed) return;
        if (e.type === "text" || e.type === "block" || e.type === "action") emittedAny = true;
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      const fallback = async () => {
        emit({ type: "meta", engine: "fallback" });
        const msgs = await loadMessages(locale);
        await runFallback(
          body,
          {
            locale,
            t: (k, v) => translate(msgs, englishMessages, k, v),
            searchJobs,
            getJob: getPublicJob,
            listTraining,
            listStations,
            learnSkills: () => getLearnSkills(locale).map((s) => ({ id: s.id, skill: s.skill })),
          },
          // Stream sentences word-by-word for a natural feel.
          (e) => {
            if (e.type !== "text") return emit(e);
            for (const w of e.delta.split(/(?<=\s)/)) emit({ type: "text", delta: w });
          },
        );
      };

      try {
        if (hasGemini() && !body.chip) {
          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), GEMINI_TIMEOUT_MS);
          try {
            emit({ type: "meta", engine: "gemini" });
            await runGemini(body, emit, ac.signal);
          } catch (err) {
            console.warn("[saathi] gemini failed:", (err as Error).message);
            if (!emittedAny) await fallback();
            else emit({ type: "error", message: "interrupted" });
          } finally {
            clearTimeout(timer);
          }
        } else {
          await fallback();
        }
        logEvent({ name: "saathi_message", locale }).catch(() => {});
        emit({ type: "done" });
      } catch (err) {
        console.error("[saathi]", err);
        emit({ type: "error" });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
