import { createHash } from "node:crypto";
import { z } from "zod";
import { gemini, hasGemini, MODELS } from "@/lib/server/gemini";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";
import { LOCALE_CODES, localeInfo, type Locale } from "@/lib/i18n/config";
import { isWav, pcmToWav, rateFromMime } from "@/lib/voice/wav";
import { CLOUD_VOICES, DEFAULT_CLOUD_VOICE } from "@/lib/voice/voices";
import { toSpeech } from "@/lib/voice/speechText";

export const maxDuration = 30;

const Body = z.object({
  text: z.string().trim().min(1).max(1200),
  locale: z.enum(LOCALE_CODES as [Locale, ...Locale[]]),
  voice: z.enum(CLOUD_VOICES).optional(),
  slow: z.boolean().optional(),
});

// Small in-process LRU so repeated phrases (greetings, tile labels) don't hit the model again.
const cache = new Map<string, Uint8Array>();
const CACHE_MAX = 200;
function remember(key: string, wav: Uint8Array) {
  cache.set(key, wav);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
}

/** GET /api/tts → { available } (never exposes configuration details). */
export function GET() {
  return Response.json({ available: hasGemini() }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/tts { text, locale, voice?, slow? } → audio/wav */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "tts", 60);
  if (limited) return limited;
  const ai = gemini();
  if (!ai) return Response.json({ error: "tts_unavailable" }, { status: 503 });

  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  const { locale, slow } = r.data;
  const text = toSpeech(r.data.text, locale);
  if (!text) return Response.json({ error: "empty" }, { status: 400 });
  const voice = r.data.voice ?? DEFAULT_CLOUD_VOICE[locale];
  const key = createHash("sha1").update(`${MODELS.tts}|${voice}|${locale}|${slow ? 1 : 0}|${text}`).digest("hex");

  const headers = { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400", "X-Voice": voice };
  const hit = cache.get(key);
  if (hit) return new Response(Buffer.from(hit), { headers });

  const lang = localeInfo(locale).english;
  const style = slow
    ? `Say this slowly and very clearly, warm and respectful, in a gentle Indian ${lang} voice:`
    : `Say this warmly and calmly, like a kind helper, in a natural Indian ${lang} voice:`;

  try {
    const res = await ai.models.generateContent({
      model: MODELS.tts,
      contents: [{ role: "user", parts: [{ text: `${style}\n${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) return Response.json({ error: "no_audio" }, { status: 502 });
    const bytes = new Uint8Array(Buffer.from(part.inlineData.data, "base64"));
    const wav = isWav(bytes) ? bytes : pcmToWav(bytes, rateFromMime(part.inlineData.mimeType));
    remember(key, wav);
    return new Response(Buffer.from(wav), { headers });
  } catch (err) {
    console.warn("[tts] generation failed:", (err as Error).message?.slice(0, 200));
    return Response.json({ error: "tts_failed" }, { status: 502 });
  }
}
