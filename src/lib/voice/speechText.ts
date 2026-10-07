import type { Locale } from "@/lib/i18n/config";

/**
 * Turns on-screen text into something a TTS voice pronounces naturally:
 * "₹10,000 – ₹12,000" → "10000 से 12000 रुपये", "9 AM – 6 PM" → "सुबह 9 बजे से शाम 6 बजे",
 * "KAABIL Saathi" → "काबिल साथी" (hi/mr), IDs spelled out, markdown and emoji removed.
 * Pure and dependency-free so it runs on client and server and is unit-tested.
 */

type DayPart = 0 | 1 | 2 | 3; // morning, afternoon, evening, night

interface Lang {
  rupees: string;
  range: (a: string, b: string) => string;
  perMonth: string;
  perDay: string;
  km: string;
  brand: string;
  saathi: string;
  dayParts: [string, string, string, string];
  time: (h12: number, m: number, part: DayPart) => string;
}

const withMin = (h: number, m: number) => (m ? `${h} ${m}` : `${h}`);

const LANGS: Record<Locale, Lang> = {
  en: {
    rupees: "rupees",
    range: (a, b) => `${a} to ${b}`,
    perMonth: "per month",
    perDay: "per day",
    km: "kilometres",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["in the morning", "in the afternoon", "in the evening", "at night"],
    time(h, m, p) {
      return `${withMin(h, m)} ${this.dayParts[p]}`;
    },
  },
  hi: {
    rupees: "रुपये",
    range: (a, b) => `${a} से ${b}`,
    perMonth: "प्रति माह",
    perDay: "प्रति दिन",
    km: "किलोमीटर",
    brand: "काबिल",
    saathi: "साथी",
    dayParts: ["सुबह", "दोपहर", "शाम", "रात"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} बजकर ${m} मिनट` : `${this.dayParts[p]} ${h} बजे`;
    },
  },
  mr: {
    rupees: "रुपये",
    range: (a, b) => `${a} ते ${b}`,
    perMonth: "दरमहा",
    perDay: "दररोज",
    km: "किलोमीटर",
    brand: "काबिल",
    saathi: "साथी",
    dayParts: ["सकाळी", "दुपारी", "संध्याकाळी", "रात्री"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} वाजून ${m} मिनिटांनी` : `${this.dayParts[p]} ${h} वाजता`;
    },
  },
  bn: {
    rupees: "টাকা",
    range: (a, b) => `${a} থেকে ${b}`,
    perMonth: "প্রতি মাসে",
    perDay: "প্রতিদিন",
    km: "কিলোমিটার",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["সকাল", "দুপুর", "সন্ধ্যা", "রাত"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h}টা ${m} মিনিট` : `${this.dayParts[p]} ${h}টা`;
    },
  },
  ta: {
    rupees: "ரூபாய்",
    range: (a, b) => `${a} முதல் ${b} வரை`,
    perMonth: "மாதத்திற்கு",
    perDay: "ஒரு நாளுக்கு",
    km: "கிலோமீட்டர்",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["காலை", "மதியம்", "மாலை", "இரவு"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} மணி ${m} நிமிடம்` : `${this.dayParts[p]} ${h} மணி`;
    },
  },
  te: {
    rupees: "రూపాయలు",
    range: (a, b) => `${a} నుండి ${b} వరకు`,
    perMonth: "నెలకు",
    perDay: "రోజుకు",
    km: "కిలోమీటర్లు",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["ఉదయం", "మధ్యాహ్నం", "సాయంత్రం", "రాత్రి"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} గంటల ${m} నిమిషాలు` : `${this.dayParts[p]} ${h} గంటలు`;
    },
  },
  kn: {
    rupees: "ರೂಪಾಯಿ",
    range: (a, b) => `${a} ರಿಂದ ${b} ವರೆಗೆ`,
    perMonth: "ತಿಂಗಳಿಗೆ",
    perDay: "ದಿನಕ್ಕೆ",
    km: "ಕಿಲೋಮೀಟರ್",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["ಬೆಳಿಗ್ಗೆ", "ಮಧ್ಯಾಹ್ನ", "ಸಂಜೆ", "ರಾತ್ರಿ"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} ಗಂಟೆ ${m} ನಿಮಿಷ` : `${this.dayParts[p]} ${h} ಗಂಟೆ`;
    },
  },
  gu: {
    rupees: "રૂપિયા",
    range: (a, b) => `${a} થી ${b}`,
    perMonth: "દર મહિને",
    perDay: "દર દિવસે",
    km: "કિલોમીટર",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["સવારે", "બપોરે", "સાંજે", "રાત્રે"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} વાગ્યે ${m} મિનિટે` : `${this.dayParts[p]} ${h} વાગ્યે`;
    },
  },
  pa: {
    rupees: "ਰੁਪਏ",
    range: (a, b) => `${a} ਤੋਂ ${b}`,
    perMonth: "ਪ੍ਰਤੀ ਮਹੀਨਾ",
    perDay: "ਪ੍ਰਤੀ ਦਿਨ",
    km: "ਕਿਲੋਮੀਟਰ",
    brand: "Kaabil",
    saathi: "Saathi",
    dayParts: ["ਸਵੇਰੇ", "ਦੁਪਹਿਰ", "ਸ਼ਾਮ", "ਰਾਤ"],
    time(h, m, p) {
      return m ? `${this.dayParts[p]} ${h} ਵੱਜ ਕੇ ${m} ਮਿੰਟ` : `${this.dayParts[p]} ${h} ਵਜੇ`;
    },
  },
};

// Native digit blocks → ASCII (Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada).
const DIGIT_BASES = [0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0be6, 0x0c66, 0x0ce6];
function normaliseDigits(s: string) {
  return s.replace(/[०-९০-৯੦-੯૦-૯௦-௯౦-౯೦-೯]/g, (ch) => {
    const c = ch.charCodeAt(0);
    const base = DIGIT_BASES.find((b) => c >= b && c <= b + 9)!;
    return String(c - base);
  });
}

const DASH = "\\s*(?:–|—|-|to|से|ते|থেকে|முதல்|నుండి|ರಿಂದ|થી|ਤੋਂ)\\s*";
const NUM = "(\\d{1,3}(?:,\\d{2,3})+|\\d+)(?:\\.(\\d+))?";
const PERIOD_MONTH = "month|mo|माह|महीना|महिना|মাস|மாதம்|నెల|ತಿಂಗಳು|મહિનો|મહિને|ਮਹੀਨਾ";
const PERIOD_DAY = "day|दिन|दिवस|দিন|நாள்|రోజు|ದಿನ|દિવસ|ਦਿਨ";
const PERIOD = `(?:\\s*(?:\\/|per|प्रति)\\s*(${PERIOD_MONTH}|${PERIOD_DAY}))?`;

const plainNum = (n: string) => n.replace(/,/g, "");

function periodWord(L: Lang, p: string | undefined) {
  if (!p) return "";
  return new RegExp(`^(?:${PERIOD_DAY})$`, "i").test(p) ? ` ${L.perDay}` : ` ${L.perMonth}`;
}

function dayPart(h24: number): DayPart {
  if (h24 >= 4 && h24 < 12) return 0;
  if (h24 >= 12 && h24 < 16) return 1;
  if (h24 >= 16 && h24 < 20) return 2;
  return 3;
}

function speakTime(L: Lang, h24: number, m: number) {
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return L.time(h12, m, dayPart(h24));
}

function to24(h: number, mer: string | undefined) {
  if (!mer) return h;
  const pm = /^p/i.test(mer);
  if (pm && h < 12) return h + 12;
  if (!pm && h === 12) return 0;
  return h;
}

// "9 AM", "9:30 a.m.", "6 PM"
const T12 = "(\\d{1,2})(?::(\\d{2}))?\\s*([AaPp])\\.?\\s*[Mm]\\.?(?![A-Za-z])";
// "09:00", "18:30"
const T24 = "([01]?\\d|2[0-3]):([0-5]\\d)";

export function toSpeech(input: string, locale: Locale): string {
  const L = LANGS[locale] ?? LANGS.en;
  let s = normaliseDigits(input);

  // Markdown, links, emoji.
  s = s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>~]+/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[️⃣]/g, "");

  // Brand words.
  s = s.replace(/KAABIL\s+Saathi/gi, `${L.brand} ${L.saathi}`).replace(/\bKAABIL\b/gi, L.brand);
  if (L.saathi !== "Saathi") s = s.replace(/\bSaathi\b/g, L.saathi);

  // IDs like KBL-7XQ2 or KB-ABCD-EFGH: spell character by character.
  s = s.replace(/\b[A-Z]{2,4}(?:-[A-Z0-9]{4,8}){1,2}\b/g, (id) => id.replace(/-/g, "").split("").join(" "));

  // Money ranges: ₹10,000 – ₹12,000 [/ month]
  s = s.replace(new RegExp(`₹\\s?${NUM}${DASH}₹?\\s?${NUM}${PERIOD}`, "gi"), (_m, a, _ad, b, _bd, p) =>
    `${L.range(plainNum(a), plainNum(b))} ${L.rupees}${periodWord(L, p)}`,
  );
  // Single amounts: ₹500 [/ day]  — also "Rs. 500"
  s = s.replace(new RegExp(`(?:₹|Rs\\.?|INR)\\s?${NUM}${PERIOD}`, "gi"), (_m, a, d, p) =>
    `${plainNum(a)}${d ? "." + d : ""} ${L.rupees}${periodWord(L, p)}`,
  );

  // Time ranges.
  s = s.replace(new RegExp(`${T12}${DASH}${T12}`, "g"), (_m, h1, m1, a1, h2, m2, a2) =>
    L.range(speakTime(L, to24(+h1, a1), +(m1 ?? 0)), speakTime(L, to24(+h2, a2), +(m2 ?? 0))),
  );
  s = s.replace(new RegExp(`\\b${T24}${DASH}${T24}\\b`, "g"), (_m, h1, m1, h2, m2) =>
    L.range(speakTime(L, +h1, +m1), speakTime(L, +h2, +m2)),
  );
  // Single times.
  s = s.replace(new RegExp(T12, "g"), (_m, h, m, a) => speakTime(L, to24(+h, a), +(m ?? 0)));
  s = s.replace(new RegExp(`\\b${T24}\\b`, "g"), (_m, h, m) => speakTime(L, +h, +m));

  // Distances.
  s = s.replace(/(\d+(?:\.\d+)?)\s?km\b/gi, `$1 ${L.km}`);

  // Remaining grouped numbers: 1,200 → 1200.
  s = s.replace(/(\d),(?=\d{2,3}\b)/g, "$1").replace(/(\d),(?=\d{2,3},)/g, "$1");

  // Symbols that read badly.
  s = s
    .replace(/\s*(?:→|·|•|\|)\s*/g, ", ")
    .replace(/\s+[–—]\s+/g, ", ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?।])/g, "$1")
    .replace(/,\s*,/g, ",")
    .trim();
  return s;
}

/** Split into speakable chunks (sentence-ish, ≤ max chars). */
export function splitSentences(text: string, max = 220): string[] {
  const parts = text
    .split(/(?<=[.!?।॥])\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= max) {
      const last = out[out.length - 1];
      if (last && last.length + p.length + 1 <= Math.min(max, 120)) out[out.length - 1] = `${last} ${p}`;
      else out.push(p);
      continue;
    }
    let rest = p;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(", ", max);
      if (cut < max * 0.4) cut = rest.lastIndexOf(" ", max);
      if (cut <= 0) cut = max;
      out.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}
