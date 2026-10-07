import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { LOCALE_CODES, type Locale } from "@/lib/i18n/config";
import { readDb } from "@/lib/db/store";
import {
  addTranslationDraft, adminErrorResponse, adminMutation, machineTranslate, publishTranslation, reviewTranslation, sourceText,
} from "@/lib/db/admin";
import type { Database } from "@/lib/types";

export const maxDuration = 60;

const loc = z.enum(LOCALE_CODES as [Locale, ...Locale[]]);
const key = z.string().regex(/^(job|employer|training):[\w-]{1,40}:\w{1,20}$/);

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("machine"), key, locales: z.array(loc).min(1).max(8) }),
  z.object({ action: z.literal("manual"), key, locale: loc, draft: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("review"), id: z.string().max(40), draft: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("publish"), id: z.string().max(40) }),
]);

export const POST = adminPost("translations", "translations.draft", Body, async (b, s) => {
  if (b.action === "machine") {
    let source: string;
    try {
      source = sourceText((await readDb()) as Database, b.key);
    } catch (err) {
      return adminErrorResponse(err);
    }
    const targets = b.locales.filter((l) => l !== "en");
    const out = await machineTranslate(source, targets).catch((e) => {
      console.error("[translate]", e);
      return {} as Partial<Record<Locale, string>>;
    });
    if (out === null) return Response.json({ error: "gemini_not_configured", message: "Gemini is not configured. Enter the translation manually." }, { status: 503 });
    const got = targets.filter((l) => out[l]);
    if (!got.length) return Response.json({ error: "translate_failed", message: "Gemini returned no usable translation. Try again or enter manually." }, { status: 502 });
    return adminMutation((db) => got.map((l) => addTranslationDraft(db, s, { key: b.key, locale: l, draft: out[l]!, origin: "machine" })));
  }
  return adminMutation((db) =>
    b.action === "manual"
      ? addTranslationDraft(db, s, { key: b.key, locale: b.locale, draft: b.draft, origin: "human" })
      : b.action === "review"
        ? reviewTranslation(db, s, b.id, b.draft)
        : publishTranslation(db, s, b.id),
  );
});
