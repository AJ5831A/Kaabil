/**
 * Deterministic Saathi engine — used when GEMINI_API_KEY is absent or Gemini fails.
 * It never invents data: every job id it emits comes from `deps.searchJobs` / `deps.getJob`.
 * Pure w.r.t. its dependencies so it can be unit tested without the database.
 */
import { townById, TOWNS } from "@/lib/geo/towns";
import { pick, type Locale } from "@/lib/i18n/config";
import { INTEREST_MAP, JOB_CATEGORIES, type InterestKey, type JobCategory, type SkillKey } from "@/lib/taxonomy";
import { formatPayRange } from "@/lib/format";
import type { JobFilters } from "@/lib/jobs/filter";
import type { PublicJob, Station, TrainingProgramme } from "@/lib/types";
import type { Vars } from "@/lib/i18n/format";
import {
  detectDistance, detectHours, detectIntent, detectJobType, detectTown, detectWork, detectYesNo, type Intent,
} from "./intents";
import type { Emit, FlowState, SaathiRequest } from "./types";

export interface FallbackDeps {
  locale: Locale;
  t: (key: string, vars?: Vars) => string;
  searchJobs: (f: JobFilters) => Promise<PublicJob[]>;
  getJob: (id: string) => Promise<PublicJob | null>;
  listTraining: (skill?: string, townId?: string) => Promise<TrainingProgramme[]>;
  listStations: (townId?: string) => Promise<Station[]>;
  learnSkills: () => { id: string; skill: SkillKey }[];
}

const CATEGORY_SKILL: Record<string, SkillKey> = Object.fromEntries(JOB_CATEGORIES.map((c) => [c.key, c.skills[0] as SkillKey]));

export async function runFallback(req: SaathiRequest, d: FallbackDeps, emit: Emit): Promise<void> {
  const { t, locale } = d;
  const profile = req.profile ?? {};
  const text = [...req.messages].reverse().find((m) => m.role === "user")?.text ?? "";
  let flow: FlowState = { ...(req.flow ?? {}) };
  const say = (key: string, vars?: Vars) => emit({ type: "text", delta: t(`saathi.reply.${key}`, vars) + " " });
  const chips = (options: { label: string; value: string }[]) => emit({ type: "block", block: { kind: "chips", options } });
  const nav = (href: string, labelKey: string) => emit({ type: "block", block: { kind: "nav", href, label: t(`saathi.nav.${labelKey}`) } });
  const workLabel = (cat?: JobCategory, skill?: SkillKey) =>
    skill ? t(`common.skills.${skill}`) : cat ? t(`common.jobCategories.${cat}`) : t("saathi.chips.otherWork");
  const townName = (id?: string) => (townById(id) ? pick(townById(id)!.name, locale) : "");
  const jobTitle = (j: PublicJob) => (j.title ? pick(j.title, locale) : t(`common.jobCategories.${j.category}`));
  const payText = (j: PublicJob) => `${formatPayRange(j.payMin, j.payMax, locale)} ${t(`common.pay.${j.payPeriod}`)}`;

  const mainChips = () =>
    chips([
      { label: t("saathi.chips.findWork"), value: "go:job" },
      { label: t("saathi.chips.learn"), value: "go:learn" },
      { label: t("saathi.chips.discover"), value: "go:discover" },
      { label: t("saathi.chips.parchi"), value: "go:parchi" },
    ]);

  const workChips = () => {
    const fromInterests = (profile.interests ?? []).flatMap((i) => INTEREST_MAP[i as InterestKey]?.categories ?? []);
    const order = [...new Set<JobCategory>([...fromInterests, "kitchen_helper", "tailoring_assistant", "housekeeping", "nursery_worker", "packing_helper", "sales_assistant", "repair_helper", "caregiver"])];
    chips(order.slice(0, 8).map((c) => ({ label: t(`common.jobCategories.${c}`), value: `cat:${c}` })));
  };
  const townChips = () => {
    const first = profile.townId ? [profile.townId] : [];
    const ids = [...new Set([...first, ...TOWNS.map((x) => x.id)])].slice(0, 8);
    chips(ids.map((id) => ({ label: townName(id), value: `town:${id}` })));
  };
  const askSlot = (slot: NonNullable<FlowState["asked"]>) => {
    flow.asked = slot;
    if (slot === "work") { say("askWork"); workChips(); }
    if (slot === "place") { say("askPlace"); townChips(); }
    if (slot === "distance") {
      say("askDistance");
      chips([5, 10, 25, 50].map((n) => ({ label: t("saathi.chips.within", { n }), value: `dist:${n}` })).concat({ label: t("saathi.chips.anywhere"), value: "dist:300" }));
    }
    if (slot === "type") chipsType();
    if (slot === "hours") {
      say("askHours");
      chips((["morning", "day", "evening", "flexible"] as const).map((h) => ({ label: t(`common.hours.${h}`), value: `hours:${h}` })));
    }
    if (slot === "experience") {
      say("askExperience");
      chips([{ label: t("saathi.chips.yes"), value: "exp:yes" }, { label: t("saathi.chips.no"), value: "exp:no" }]);
    }
  };
  function chipsType() {
    say("askType");
    chips([
      { label: t("common.jobType.full_time"), value: "type:full_time" },
      { label: t("common.jobType.part_time"), value: "type:part_time" },
      { label: t("saathi.chips.skip"), value: "type:any" },
    ]);
  }

  // ---------------------------------------------------------------- input → intent / slots
  let intent: Intent = "unknown";
  let filledSlot = false;
  const chip = req.chip;
  if (chip) {
    const [k, v] = chip.split(":");
    if (k === "go") intent = v as Intent;
    else if (k === "cat" && JOB_CATEGORIES.some((c) => c.key === v)) {
      flow = { ...flow, mode: "job", category: v as JobCategory, skill: CATEGORY_SKILL[v] };
      filledSlot = true;
    } else if (k === "town" && townById(v)) { flow = { ...flow, mode: flow.mode ?? "job", townId: v }; filledSlot = true; }
    else if (k === "dist") { flow = { ...flow, maxDistanceKm: Math.min(300, Math.max(1, Number(v) || 25)) }; filledSlot = true; }
    else if (k === "type") { flow = { ...flow, type: v === "any" ? undefined : (v as FlowState["type"]), anyType: v === "any" }; filledSlot = true; }
    else if (k === "hours") { flow = { ...flow, hoursBand: v as FlowState["hoursBand"] }; filledSlot = true; }
    else if (k === "exp") { flow = { ...flow, experience: v as "yes" | "no" }; filledSlot = true; }
    else if (k === "refine") { flow = { ...flow, mode: "job", refining: true, maxDistanceKm: undefined, type: undefined, anyType: undefined, hoursBand: undefined, experience: undefined }; filledSlot = true; }
    else if (k === "further") { flow = { ...flow, mode: "job", maxDistanceKm: 300 }; filledSlot = true; }
    else if (k === "learn") { intent = "learn"; flow.skill = v as SkillKey; }
    else if (k === "all") { flow = { mode: "job", townId: flow.townId ?? profile.townId }; intent = "nearby"; }
  }

  if (!chip && text) {
    intent = detectIntent(text);
    const work = detectWork(text);
    const town = detectTown(text);
    // Answer to the question asked last turn.
    if (flow.asked === "work" && work) { flow.category = work.category; flow.skill = work.skill; filledSlot = true; }
    if (flow.asked === "place" && town) { flow.townId = town.id; filledSlot = true; }
    if (flow.asked === "distance") { const km = detectDistance(text); if (km) { flow.maxDistanceKm = km; filledSlot = true; } }
    if (flow.asked === "type") { const ty = detectJobType(text); flow.type = ty; flow.anyType = !ty; filledSlot = true; }
    if (flow.asked === "hours") { const h = detectHours(text); if (h) { flow.hoursBand = h; filledSlot = true; } }
    if (flow.asked === "experience") { const yn = detectYesNo(text); if (yn) { flow.experience = yn; filledSlot = true; } }
    // Opportunistic extraction from free speech ("मुझे सिलाई आती है ... Pilani में").
    if ((intent === "job" || intent === "nearby" || flow.mode === "job") && work && !flow.category) { flow.category = work.category; flow.skill = work.skill; }
    if ((intent === "job" || intent === "nearby" || flow.mode === "job") && town) flow.townId = town.id;
    if (intent === "learn" && work) flow.skill = work.skill;
    if (intent === "experience" && work) flow.skill = work.skill;
    if ((intent === "salary" || intent === "skill_req") && work && !req.context?.jobId) { flow.category = work.category; flow.skill = work.skill; }
    if (flow.asked === "place" && !town && intent === "unknown") { say("askPlaceAgain"); townChips(); return finish(); }
    if (filledSlot && (intent === "unknown" || intent === "experience" || intent === "greet")) intent = "job";
  }
  if (chip && filledSlot) intent = "job";

  // ---------------------------------------------------------------- handlers
  async function showJobs(mode: "match" | "nearby") {
    const townId = flow.townId ?? profile.townId;
    const base: JobFilters = {
      townId,
      skill: mode === "match" ? flow.skill : undefined,
      type: flow.type,
      hoursBand: flow.hoursBand,
      maxDistanceKm: townId ? flow.maxDistanceKm ?? profile.maxDistanceKm ?? 25 : undefined,
      sort: townId ? "distance" : "pay",
    };
    let jobs = await d.searchJobs(base);
    let further = false;
    if (!jobs.length && townId && (base.maxDistanceKm ?? 0) < 120) {
      jobs = await d.searchJobs({ ...base, maxDistanceKm: 120 });
      further = jobs.length > 0;
    }
    if (flow.experience === "no") jobs = jobs.filter((j) => j.experience !== "required");
    jobs = jobs.slice(0, 6);
    const town = townName(townId);
    const work = workLabel(flow.category, flow.skill);
    if (!jobs.length) {
      const anywhere = mode === "match" ? await d.searchJobs({ skill: flow.skill }) : [];
      if (mode === "match" && !anywhere.length) say("noneAtAll", { work });
      else say("none", { work, town: town || "—" });
      const tr = flow.skill ? await d.listTraining(flow.skill, townId) : [];
      if (tr.length) emit({ type: "block", block: { kind: "training", ids: tr.slice(0, 3).map((x) => x.id) } });
      chips([
        { label: t("saathi.chips.further"), value: "further:1" },
        { label: t("saathi.chips.learn"), value: `learn:${flow.skill ?? ""}` },
        { label: t("saathi.chips.showAll"), value: "all:1" },
      ]);
      flow.lastJobIds = [];
      return;
    }
    const v = jobs.filter((j) => j.verified).length;
    if (further) say("foundFurther", { n: jobs.length, town });
    else if (mode === "nearby") say("foundAll", { n: jobs.length, town });
    else if (v === jobs.length) say(jobs.length === 1 ? "foundOneVerified" : "foundVerified", { n: jobs.length, town });
    else say("foundMixed", { n: jobs.length, v, town });
    emit({ type: "block", block: { kind: "jobs", jobIds: jobs.map((j) => j.id) } });
    flow.lastJobIds = jobs.map((j) => j.id);
    say("disclaimer");
    const refineChips = [
      ...(!flow.refining ? [{ label: t("saathi.chips.refine"), value: "refine:1" }] : []),
      { label: t("saathi.chips.printOptions"), value: "go:parchi_options" },
      { label: t("saathi.chips.training"), value: `learn:${flow.skill ?? jobs[0].skills[0]}` },
    ];
    chips(refineChips);
    flow.asked = undefined;
  }

  async function jobFlow() {
    flow.mode = "job";
    if (!flow.category && !flow.skill) return askSlot("work");
    if (!flow.townId && profile.townId) flow.townId = profile.townId;
    if (!flow.townId) {
      flow.asked = "place";
      say("workAck", { work: workLabel(flow.category, flow.skill) });
      return townChips();
    }
    if (flow.refining) {
      if (flow.maxDistanceKm == null) return askSlot("distance");
      if (!flow.type && !flow.anyType) return askSlot("type");
      if (!flow.hoursBand) return askSlot("hours");
      if (!flow.experience) return askSlot("experience");
    }
    await showJobs("match");
  }

  async function handle() {
    const ctxJob = req.context?.jobId ? await d.getJob(req.context.jobId) : null;
    switch (intent) {
      case "job":
        return jobFlow();
      case "nearby": {
        flow.mode = "job";
        if (!flow.townId && !profile.townId) { flow.asked = "place"; say("nearbyAskTown"); return townChips(); }
        flow.townId ??= profile.townId;
        return showJobs(flow.category ? "match" : "nearby");
      }
      case "learn": {
        flow.mode = "learn";
        const skill = flow.skill;
        if (!skill) {
          say("learnAsk");
          const skills = d.learnSkills().map((s) => s.skill);
          return emit({ type: "block", block: { kind: "skills", skills: [...new Set(skills)].slice(0, 8) } });
        }
        const course = d.learnSkills().find((s) => s.skill === skill);
        say("learnSkill", { skill: t(`common.skills.${skill}`) });
        if (course) nav(`/learn/${course.id}`, "learn");
        const tr = await d.listTraining(skill, flow.townId ?? profile.townId);
        if (tr.length) {
          say("learnTraining");
          emit({ type: "block", block: { kind: "training", ids: tr.slice(0, 3).map((x) => x.id) } });
        }
        return;
      }
      case "experience": {
        const skill = flow.skill!;
        say("experienceAck", { work: t(`common.skills.${skill}`) });
        const skills = [...new Set([...(profile.skills ?? []), skill])];
        emit({ type: "action", action: { kind: "save_profile", patch: { skills } } });
        const cat = JOB_CATEGORIES.find((c) => (c.skills as readonly string[]).includes(skill));
        return chips([
          { label: t("saathi.chips.findWork"), value: cat ? `cat:${cat.key}` : "go:job" },
          { label: t("saathi.chips.learn"), value: `learn:${skill}` },
        ]);
      }
      case "no_phone": {
        say("noPhone");
        const st = await d.listStations(flow.townId ?? profile.townId);
        if (st.length) emit({ type: "block", block: { kind: "stations", ids: st.slice(0, 3).map((s) => s.id) } });
        nav("/parchi", "parchi");
        return;
      }
      case "options": {
        const cats = new Set<JobCategory>();
        for (const i of profile.interests ?? []) INTEREST_MAP[i as InterestKey]?.categories.forEach((c) => cats.add(c));
        for (const s of profile.skills ?? []) JOB_CATEGORIES.filter((c) => (c.skills as readonly string[]).includes(s)).forEach((c) => cats.add(c.key));
        if (flow.category) cats.add(flow.category);
        if (!cats.size) { say("optionsNoProfile"); nav("/discover", "discover"); return workChips(); }
        say("options");
        return chips([...cats].slice(0, 8).map((c) => ({ label: t(`common.jobCategories.${c}`), value: `cat:${c}` })));
      }
      case "parchi" as Intent: {
        say("parchi");
        nav("/parchi", "parchi");
        const n = profile.savedJobIds?.length ?? 0;
        if (n) { say("parchiOptions", { n }); nav("/parchi/options", "options"); }
        return;
      }
      case "salary": {
        const jobs = ctxJob ? [ctxJob] : await jobsFromFlow();
        if (!jobs.length) return say("salaryNoJob");
        if (jobs.length === 1) {
          const j = jobs[0];
          say("salary", { title: jobTitle(j), employer: j.employer.name, pay: payText(j) });
          return emit({ type: "block", block: { kind: "jobs", jobIds: [j.id] } });
        }
        say("salaryList");
        emit({ type: "text", delta: "\n" + jobs.slice(0, 4).map((j) => "• " + t("saathi.reply.salaryLine", { title: `${jobTitle(j)} (${j.employer.name})`, pay: payText(j) })).join("\n") + "\n" });
        return emit({ type: "block", block: { kind: "compare", jobIds: jobs.slice(0, 3).map((j) => j.id) } });
      }
      case "skill_req": {
        const jobs = ctxJob ? [ctxJob] : (await jobsFromFlow()).slice(0, 1);
        if (!jobs.length) return say("skillReqNoJob");
        const j = jobs[0];
        say("skillReq", {
          title: jobTitle(j),
          skills: j.skills.map((s) => t(`common.skills.${s}`)).join(", "),
          experience: t(`common.experience.${j.experience}`),
          training: t(`common.training.${j.training}`),
        });
        return chips([{ label: t("saathi.chips.learn"), value: `learn:${j.skills[0]}` }]);
      }
      case "discover":
        say("discover");
        return nav("/discover", "discover");
      case "report": {
        const id = ctxJob?.id;
        if (id) { say("reportJob"); return emit({ type: "action", action: { kind: "report", jobId: id } }); }
        return say("report");
      }
      case "help": say("help"); return mainChips();
      case "thanks": return say("thanks");
      case "greet": {
        if (profile.name) {
          const nextKey = !(profile.strengths?.length) ? "nextDiscover" : !(profile.learning?.length) ? "nextLearn" : "nextJobs";
          say("greetName", { name: profile.name, next: t(`saathi.reply.${nextKey}`, { skill: t(`common.skills.${profile.skills?.[0] ?? "cooking"}`) }) });
        } else say("greet");
        return mainChips();
      }
      default: {
        if (String(intent) === "parchi_options") { nav("/parchi/options", "options"); return; }
        if (String(intent) === "station") { say("station"); const st = await d.listStations(profile.townId); emit({ type: "block", block: { kind: "stations", ids: st.slice(0, 3).map((s) => s.id) } }); return; }
        say("unknown");
        return mainChips();
      }
    }
  }

  async function jobsFromFlow(): Promise<PublicJob[]> {
    if (flow.lastJobIds?.length) {
      const all = await Promise.all(flow.lastJobIds.slice(0, 4).map((id) => d.getJob(id)));
      return all.filter((j): j is PublicJob => !!j);
    }
    if (flow.skill) return (await d.searchJobs({ skill: flow.skill, townId: flow.townId ?? profile.townId })).slice(0, 4);
    return [];
  }

  function finish() {
    emit({ type: "flow", flow });
  }

  await handle();
  finish();
}
