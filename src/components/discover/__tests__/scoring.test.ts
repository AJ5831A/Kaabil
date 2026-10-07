import { describe, expect, it } from "vitest";
import { scoreDiscovery, type DiscoverInput } from "../scoring";

const base: DiscoverInput = { interests: [], attention: null, sequence: null, coordination: null, scenarios: [], experience: [], years: 0 };

describe("scoreDiscovery", () => {
  it("always returns between 2 and 4 strengths, even when everything is skipped", () => {
    const r = scoreDiscovery(base);
    expect(r.strengths.length).toBeGreaterThanOrEqual(2);
    expect(r.strengths.length).toBeLessThanOrEqual(4);
  });

  it("rewards a careful attention task with attention to detail", () => {
    const r = scoreDiscovery({ ...base, attention: { correct: 4, wrong: 0, total: 4 } });
    expect(r.strengths).toContain("attention_to_detail");
    expect(r.strengths).toContain("accuracy");
  });

  it("does not reward wild tapping", () => {
    const r = scoreDiscovery({ ...base, attention: { correct: 4, wrong: 12, total: 4 } });
    expect(r.scores.attention_to_detail).toBeLessThan(1);
  });

  it("good timing → coordination", () => {
    const r = scoreDiscovery({ ...base, coordination: { errors: [0.02, 0.05, 0.03] } });
    expect(r.strengths[0]).toBe("coordination");
  });

  it("maps experience to skills and interests to preferred work", () => {
    const r = scoreDiscovery({ ...base, interests: ["sewing"], experience: ["stitching", "home_cooking"], years: 3 });
    expect(r.skills).toEqual(expect.arrayContaining(["sewing", "cooking"]));
    expect(r.preferredWork).toContain("tailoring_assistant");
    expect(r.strengths).toContain("practical");
  });

  it("scenario choices nudge strengths", () => {
    const r = scoreDiscovery({ ...base, scenarios: [0, 0, 0] });
    expect(r.strengths).toEqual(expect.arrayContaining(["communication", "problem_solving"]));
  });

  it("is deterministic", () => {
    const input: DiscoverInput = { ...base, interests: ["cooking", "selling"], sequence: { mistakes: 1 }, scenarios: [0, 1, 2] };
    expect(scoreDiscovery(input)).toEqual(scoreDiscovery(input));
  });
});
