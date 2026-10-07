import { describe, expect, it } from "vitest";
import { splitSentences, toSpeech } from "../speechText";

describe("toSpeech — spec examples", () => {
  it("reads rupee ranges in Hindi", () => {
    expect(toSpeech("₹10,000 – ₹12,000", "hi")).toBe("10000 से 12000 रुपये");
  });
  it("reads times in Hindi with day parts", () => {
    expect(toSpeech("9 AM – 6 PM", "hi")).toBe("सुबह 9 बजे से शाम 6 बजे");
  });
  it("pronounces the brand per language", () => {
    expect(toSpeech("KAABIL Saathi", "hi")).toBe("काबिल साथी");
    expect(toSpeech("KAABIL Saathi", "mr")).toBe("काबिल साथी");
    expect(toSpeech("KAABIL Saathi", "en")).toBe("Kaabil Saathi");
    expect(toSpeech("KAABIL Saathi", "ta")).toBe("Kaabil Saathi");
    expect(toSpeech("मेरी KAABIL पर्ची", "hi")).toBe("मेरी काबिल पर्ची");
  });
});

describe("toSpeech — money", () => {
  it("handles per-month suffix", () => {
    expect(toSpeech("₹10,000 – ₹12,000 / month", "hi")).toBe("10000 से 12000 रुपये प्रति माह");
    expect(toSpeech("₹10,000 – ₹12,000 / month", "en")).toBe("10000 to 12000 rupees per month");
    expect(toSpeech("₹10,000–₹12,000/month", "en")).toBe("10000 to 12000 rupees per month");
  });
  it("handles per-day and single amounts", () => {
    expect(toSpeech("₹300 – ₹350 / day", "en")).toBe("300 to 350 rupees per day");
    expect(toSpeech("Pay ₹500 to register.", "en")).toBe("Pay 500 rupees to register.");
    expect(toSpeech("₹1,00,000", "hi")).toBe("100000 रुपये");
  });
  it("covers every locale with a rupee word", () => {
    const expected: Record<string, string> = {
      mr: "10000 ते 12000 रुपये",
      bn: "10000 থেকে 12000 টাকা",
      ta: "10000 முதல் 12000 வரை ரூபாய்",
      te: "10000 నుండి 12000 వరకు రూపాయలు",
      kn: "10000 ರಿಂದ 12000 ವರೆಗೆ ರೂಪಾಯಿ",
      gu: "10000 થી 12000 રૂપિયા",
      pa: "10000 ਤੋਂ 12000 ਰੁਪਏ",
    };
    for (const [l, v] of Object.entries(expected)) expect(toSpeech("₹10,000 – ₹12,000", l as never)).toBe(v);
  });
  it("normalises native digits", () => {
    expect(toSpeech("₹১০,০০০ – ₹১২,০০০", "bn")).toBe("10000 থেকে 12000 টাকা");
    expect(toSpeech("₹१०,००० – ₹१२,०००", "hi")).toBe("10000 से 12000 रुपये");
  });
});

describe("toSpeech — time", () => {
  it("reads 12h ranges in English", () => {
    expect(toSpeech("9 AM – 6 PM", "en")).toBe("9 in the morning to 6 in the evening");
    expect(toSpeech("6:30 am - 11 a.m.", "en")).toBe("6 30 in the morning to 11 in the morning");
  });
  it("reads 24h ranges", () => {
    expect(toSpeech("09:00–18:00", "hi")).toBe("सुबह 9 बजे से शाम 6 बजे");
    expect(toSpeech("16:00–20:00", "en")).toBe("4 in the evening to 8 at night");
    expect(toSpeech("06:30", "hi")).toBe("सुबह 6 बजकर 30 मिनट");
  });
  it("uses local day-part words", () => {
    expect(toSpeech("9 AM – 6 PM", "mr")).toBe("सकाळी 9 वाजता ते संध्याकाळी 6 वाजता");
    expect(toSpeech("9 AM – 6 PM", "ta")).toBe("காலை 9 மணி முதல் மாலை 6 மணி வரை");
    expect(toSpeech("2 PM", "gu")).toBe("બપોરે 2 વાગ્યે");
  });
  it("does not treat words starting with 'am' as times", () => {
    expect(toSpeech("9 amazing helpers", "en")).toBe("9 amazing helpers");
  });
});

describe("toSpeech — misc", () => {
  it("spells IDs", () => {
    expect(toSpeech("Application ID: KBL-7XQ2", "en")).toBe("Application ID: K B L 7 X Q 2");
    expect(toSpeech("KB-AB12-CD34", "en")).toBe("K B A B 1 2 C D 3 4");
  });
  it("reads km", () => {
    expect(toSpeech("12.5 km away", "en")).toBe("12.5 kilometres away");
    expect(toSpeech("5 km", "hi")).toBe("5 किलोमीटर");
  });
  it("strips markdown and emoji", () => {
    expect(toSpeech("✅ **Verified** employer 🍳", "en")).toBe("Verified employer");
    expect(toSpeech("Find *work* near you", "en")).toBe("Find work near you");
  });
  it("softens arrows and separators", () => {
    expect(toSpeech("Ability → Skill → Opportunity", "en")).toBe("Ability, Skill, Opportunity");
  });
  it("leaves ordinary hyphenated words alone", () => {
    expect(toSpeech("Full-time and part-time", "en")).toBe("Full-time and part-time");
  });
});

describe("splitSentences", () => {
  it("splits on Latin and Devanagari stops", () => {
    expect(splitSentences("नमस्ते! मैं काबिल साथी हूँ। आप क्या करना चाहते हैं?", 25)).toEqual([
      "नमस्ते!",
      "मैं काबिल साथी हूँ।",
      "आप क्या करना चाहते हैं?",
    ]);
  });
  it("merges short sentences and caps long ones", () => {
    expect(splitSentences("Hi. Okay.")).toEqual(["Hi. Okay."]);
    const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const chunks = splitSentences(long, 100);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.join(" ")).toBe(long);
  });
});
