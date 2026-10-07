import { describe, expect, it } from "vitest";
import { runFallback, type FallbackDeps } from "../fallback";
import type { FlowState, SaathiEvent, SaathiRequest } from "../types";
import { createSeed } from "@/lib/db/seed";
import { toPublicJobForTest } from "./helpers";
import { filterJobs, type JobFilters } from "@/lib/jobs/filter";
import { englishMessages } from "@/messages";
import { translate } from "@/lib/i18n/format";
import { isJobPublic } from "@/lib/verification";

const db = createSeed();
const publicJobs = db.jobs.filter(isJobPublic).map((j) => toPublicJobForTest(j, db.employers.find((e) => e.id === j.employerId)));

function deps(returned: Set<string>): FallbackDeps {
  return {
    locale: "en",
    t: (k, v) => translate(englishMessages, englishMessages, k, v),
    searchJobs: async (f: JobFilters) => {
      const r = filterJobs(publicJobs, f);
      r.forEach((j) => returned.add(j.id));
      return r;
    },
    getJob: async (id) => {
      const j = publicJobs.find((x) => x.id === id) ?? null;
      if (j) returned.add(j.id);
      return j;
    },
    listTraining: async (skill) => db.training.filter((t) => !skill || t.skill === skill),
    listStations: async () => db.stations,
    learnSkills: () => [{ id: "tailoring", skill: "sewing" }, { id: "cooking", skill: "cooking" }],
  };
}

async function turn(text: string, flow?: FlowState, chip?: string, returned = new Set<string>()) {
  const events: SaathiEvent[] = [];
  const req: SaathiRequest = { messages: [{ role: "user", text }], locale: "en", profile: {}, flow, chip };
  await runFallback(req, deps(returned), (e) => events.push(e));
  const text_ = events.filter((e) => e.type === "text").map((e) => (e as { delta: string }).delta).join("");
  const flowOut = (events.find((e) => e.type === "flow") as { flow: FlowState } | undefined)?.flow ?? {};
  const jobIds = events.flatMap((e) => (e.type === "block" && (e.block.kind === "jobs" || e.block.kind === "compare") ? e.block.jobIds : []));
  return { events, text: text_, flow: flowOut, jobIds, returned };
}

describe("fallback Saathi engine", () => {
  it("reproduces the A19 journey: sewing → Pilani → verified tailoring jobs", async () => {
    const t1 = await turn("मुझे सिलाई आती है और मुझे काम चाहिए।");
    expect(t1.flow).toMatchObject({ skill: "sewing", asked: "place" });
    expect(t1.text).toMatch(/Where would you like to work/);
    expect(t1.events.some((e) => e.type === "block" && e.block.kind === "chips")).toBe(true);

    const t2 = await turn("Pilani।", t1.flow);
    expect(t2.jobIds.length).toBeGreaterThan(0);
    expect(t2.text).toMatch(/suitable verified opportunit/);
    expect(t2.text).toMatch(/does not guarantee a job/);
    for (const id of t2.jobIds) expect(publicJobs.find((j) => j.id === id)?.skills).toContain("sewing");
  });

  it("asks one question at a time when refining", async () => {
    const base: FlowState = { mode: "job", skill: "cooking", category: "kitchen_helper", townId: "pilani" };
    const r1 = await turn("", base, "refine:1");
    expect(r1.flow.asked).toBe("distance");
    const r2 = await turn("", r1.flow, "dist:50");
    expect(r2.flow.asked).toBe("type");
    const r3 = await turn("", r2.flow, "type:full_time");
    expect(r3.flow.asked).toBe("hours");
    const r4 = await turn("", r3.flow, "hours:day");
    expect(r4.flow.asked).toBe("experience");
    const r5 = await turn("", r4.flow, "exp:no");
    expect(r5.jobIds.length).toBeGreaterThan(0);
    for (const id of r5.jobIds) expect(publicJobs.find((j) => j.id === id)?.experience).not.toBe("required");
  });

  it.each([
    ["I need a job"], ["मेरे आसपास कौन-सी vacancies हैं?"], ["यह नौकरी कितनी salary देती है?"], ["I can cook"],
    ["print my parchi"], ["no phone"], ["what are my options"], ["learn sewing"], ["random words"],
  ])("never emits a job id that the data layer did not return (%s)", async (text) => {
    const returned = new Set<string>();
    const r = await turn(text, { townId: "pilani", mode: "job", skill: "cooking" }, undefined, returned);
    for (const id of r.jobIds) expect(returned.has(id)).toBe(true);
  });

  it("never surfaces unapproved listings such as j14", async () => {
    const r = await turn("data entry typing job", { mode: "job", townId: "jaipur", skill: "digital_basics", category: "data_entry" });
    expect(r.jobIds).not.toContain("j14");
    expect(r.text).not.toMatch(/guaranteed/i);
  });

  it("does not claim 'verified' when listings are unverified", async () => {
    const r = await turn("", { mode: "job", townId: "pilani", skill: "sales" }, "type:any");
    const unverified = r.jobIds.filter((id) => !publicJobs.find((j) => j.id === id)?.verified);
    if (unverified.length) expect(r.text).not.toMatch(/suitable verified/);
  });
});
