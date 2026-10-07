import { describe, expect, it } from "vitest";
import en from "../learn/en.json";
import hi from "../learn/hi.json";
import { mergeContent, LEARN_META } from "../learn/meta";
import type { RawLearnContent } from "../learn/types";

const files: Record<string, RawLearnContent> = { en, hi };

describe("learning content", () => {
  for (const [code, c] of Object.entries(files)) {
    it(`${code}: every skill has 3+ lessons, 4–6 steps and valid quiz answers`, () => {
      for (const m of LEARN_META) {
        const s = c.skills[m.id];
        expect(s, `${code}/${m.id}`).toBeTruthy();
        expect(s.lessons.length).toBeGreaterThanOrEqual(3);
        for (const l of s.lessons) {
          expect(l.steps.length).toBeGreaterThanOrEqual(4);
          expect(l.steps.length).toBeLessThanOrEqual(6);
          for (const q of l.quiz ?? []) expect(q.answer).toBeLessThan(q.options.length);
        }
      }
    });
  }

  it("hi mirrors en lesson ids and quiz answer keys", () => {
    for (const m of LEARN_META) {
      const a = en.skills[m.id as keyof typeof en.skills].lessons;
      const b = hi.skills[m.id as keyof typeof hi.skills].lessons;
      expect(b.map((l) => l.id)).toEqual(a.map((l) => l.id));
      a.forEach((l, i) => expect((b[i].quiz ?? []).map((q) => q.answer)).toEqual((l.quiz ?? []).map((q) => q.answer)));
    }
  });

  it("unreviewed locales fall back to English and are marked review", () => {
    const ta = mergeContent("ta", undefined, en);
    expect(ta).toHaveLength(LEARN_META.length);
    expect(ta.every((s) => s.status === "review")).toBe(true);
    expect(mergeContent("hi", hi, en).every((s) => s.status === "published")).toBe(true);
  });
});
