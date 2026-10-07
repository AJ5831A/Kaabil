import "server-only";
import { z } from "zod";
import type { Content, Part } from "@google/genai";
import { gemini, MODELS } from "@/lib/server/gemini";
import { getPublicJob, getPublicJobs, listStations, listTraining, searchJobs } from "@/lib/db/repo";
import { JobFiltersSchema } from "@/lib/jobs/filter";
import { HOURS_BANDS, JOB_TYPES, SKILLS, STRENGTHS } from "@/lib/taxonomy";
import { townById } from "@/lib/geo/towns";
import { pick, type Locale } from "@/lib/i18n/config";
import { getLearnSkill, getLearnSkills } from "@/content/learn";
import type { PublicJob } from "@/lib/types";
import { buildSystemPrompt } from "./prompt";
import { TOOL_DECLARATIONS } from "./tools";
import { wrapUntrusted } from "./sanitize";
import { SCREENS, safeHref, type Emit, type SaathiRequest } from "./types";

const MAX_ROUNDS = 4;

/** Compact, model-facing view of a job. `verified` is server-computed. */
function jobForModel(j: PublicJob, locale: Locale) {
  return {
    id: j.id,
    title: j.title ? pick(j.title, locale) : j.category,
    category: j.category,
    employer: j.employer.name,
    town: pick(townById(j.townId)?.name, locale) || j.townId,
    distanceKm: j.distanceKm,
    pay: `${j.payMin}-${j.payMax} INR per ${j.payPeriod}`,
    type: j.type,
    hours: `${j.shift.start}-${j.shift.end}`,
    skills: j.skills,
    experience: j.experience,
    training: j.training,
    description: pick(j.description, locale),
    joining: pick(j.joining, locale),
    verified: j.verified,
  };
}

const ProfilePatch = z
  .object({
    name: z.string().max(60).optional(),
    skills: z.array(z.enum(SKILLS)).max(14).optional(),
    strengths: z.array(z.enum(STRENGTHS)).max(9).optional(),
    experience: z.string().max(300).optional(),
    townId: z.string().max(40).refine((v) => !!townById(v)).optional(),
    maxDistanceKm: z.number().min(1).max(300).optional(),
    jobType: z.enum(JOB_TYPES).optional(),
    hoursBand: z.enum(HOURS_BANDS).optional(),
  })
  .strip();

/** Executes one tool call. Emits UI blocks/actions; returns the model-facing result. */
export async function executeTool(name: string, rawArgs: Record<string, unknown> | undefined, req: SaathiRequest, emit: Emit): Promise<unknown> {
  const args = rawArgs ?? {};
  const locale = req.locale as Locale;
  switch (name) {
    case "search_jobs": {
      const parsed = JobFiltersSchema.safeParse({
        ...args,
        townId: args.townId ?? req.profile?.townId,
        maxDistanceKm: args.maxDistanceKm ?? (args.townId || req.profile?.townId ? req.profile?.maxDistanceKm ?? 25 : undefined),
      });
      if (!parsed.success) return { error: "invalid filters" };
      const jobs = (await searchJobs(parsed.data)).slice(0, 6);
      if (jobs.length) emit({ type: "block", block: { kind: "jobs", jobIds: jobs.map((j) => j.id) } });
      return { count: jobs.length, jobs: wrapUntrusted("jobs", jobs.map((j) => jobForModel(j, locale))) };
    }
    case "get_job_details": {
      const job = await getPublicJob(String(args.jobId ?? "").slice(0, 40));
      if (!job) return { error: "not found or not approved" };
      emit({ type: "block", block: { kind: "jobs", jobIds: [job.id] } });
      return { job: wrapUntrusted("job", jobForModel(job, locale)) };
    }
    case "compare_jobs": {
      const ids = Array.isArray(args.jobIds) ? args.jobIds.map(String).slice(0, 3) : [];
      const jobs = await getPublicJobs(ids);
      if (jobs.length >= 2) emit({ type: "block", block: { kind: "compare", jobIds: jobs.map((j) => j.id) } });
      return { jobs: wrapUntrusted("jobs", jobs.map((j) => jobForModel(j, locale))) };
    }
    case "list_skills": {
      const skills = getLearnSkills(locale);
      emit({ type: "block", block: { kind: "skills", skills: [...new Set(skills.map((s) => s.skill))].slice(0, 8) } });
      return { courses: skills.map((s) => ({ courseId: s.id, skill: s.skill, title: s.title, summary: s.summary, minutes: s.minutes, lessons: s.lessons.length })) };
    }
    case "get_lesson": {
      const course = (args.courseId ? getLearnSkill(String(args.courseId), locale) : undefined) ?? getLearnSkills(locale).find((s) => s.skill === args.skill);
      if (!course) return { error: "course not found" };
      const lesson = args.lessonId ? course.lessons.find((l) => l.id === args.lessonId) : undefined;
      emit({ type: "block", block: { kind: "nav", href: `/learn/${course.id}`, label: course.title } });
      return { course: { courseId: course.id, title: course.title, summary: course.summary, lessons: course.lessons.map((l) => ({ id: l.id, title: l.title })) }, lesson: lesson ?? course.lessons[0] };
    }
    case "save_skill_profile": {
      const p = ProfilePatch.safeParse(args);
      if (!p.success) return { error: "invalid profile fields" };
      const patch = { ...p.data } as Record<string, unknown>;
      if (p.data.skills) patch.skills = [...new Set([...(req.profile?.skills ?? []), ...p.data.skills])];
      emit({ type: "action", action: { kind: "save_profile", patch } });
      return { saved: Object.keys(patch) };
    }
    case "add_to_parchi": {
      const job = await getPublicJob(String(args.jobId ?? "").slice(0, 40));
      if (!job) return { error: "not found or not approved" };
      emit({ type: "action", action: { kind: "add_to_parchi", jobId: job.id } });
      return { added: job.id };
    }
    case "find_training": {
      const items = (await listTraining(args.skill ? String(args.skill) : undefined, args.townId ? String(args.townId) : req.profile?.townId)).slice(0, 4);
      if (items.length) emit({ type: "block", block: { kind: "training", ids: items.map((t) => t.id) } });
      return { training: wrapUntrusted("training", items.map((t) => ({ id: t.id, name: pick(t.name, locale), provider: t.provider, skill: t.skill, town: t.townId, weeks: t.durationWeeks, feeINR: t.fee, mode: t.mode }))) };
    }
    case "find_stations": {
      const items = (await listStations(args.townId ? String(args.townId) : req.profile?.townId)).slice(0, 4);
      if (items.length) emit({ type: "block", block: { kind: "stations", ids: items.map((s) => s.id) } });
      return { stations: wrapUntrusted("stations", items.map((s) => ({ id: s.id, name: pick(s.name, locale), town: s.townId, hours: s.hours, printer: s.hasPrinter }))) };
    }
    case "navigate_to_screen": {
      const screen = String(args.screen ?? "");
      const href =
        screen === "job" ? `/jobs/${String(args.jobId ?? "")}` : screen === "course" ? `/learn/${String(args.courseId ?? "")}` : SCREENS[screen];
      const safe = href ? safeHref(href) : null;
      if (!safe) return { error: "unknown screen" };
      if (screen === "job" && !(await getPublicJob(String(args.jobId)))) return { error: "job not found" };
      emit({ type: "action", action: { kind: "navigate", href: safe } });
      return { opened: safe };
    }
    case "print_parchi": {
      const which = args.which === "job" || args.which === "options" ? args.which : "profile";
      if (which === "job") {
        const job = await getPublicJob(String(args.jobId ?? ""));
        if (!job) return { error: "job not found" };
        emit({ type: "action", action: { kind: "print_parchi", which, jobId: job.id } });
      } else emit({ type: "action", action: { kind: "print_parchi", which } });
      return { opened: which };
    }
    case "report_listing": {
      const job = await getPublicJob(String(args.jobId ?? ""));
      if (!job) return { error: "job not found" };
      emit({ type: "action", action: { kind: "report", jobId: job.id } });
      return { reportFormOpened: true };
    }
    case "suggest_replies": {
      const opts = Array.isArray(args.options) ? args.options.map((o) => String(o).slice(0, 40)).filter(Boolean).slice(0, 6) : [];
      if (opts.length) emit({ type: "block", block: { kind: "chips", options: opts.map((o) => ({ label: o, value: "" })) } });
      return { shown: opts.length };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

/** Gemini tool-calling loop with streaming text. Throws on failure (caller falls back). */
export async function runGemini(req: SaathiRequest, emit: Emit, signal?: AbortSignal): Promise<void> {
  const ai = gemini();
  if (!ai) throw new Error("no_gemini");
  const contents: Content[] = req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  const systemInstruction = buildSystemPrompt(req);
  let emittedText = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const stream = await ai.models.generateContentStream({
      model: MODELS.chat,
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        temperature: 0.5,
        maxOutputTokens: 800,
        abortSignal: signal,
      },
    });
    const modelParts: Part[] = [];
    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        modelParts.push(part);
        if (part.text && !part.thought) {
          emittedText = true;
          emit({ type: "text", delta: part.text });
        }
      }
    }
    const calls = modelParts.filter((p) => p.functionCall);
    if (!calls.length) break;
    // Return the model's parts verbatim (preserves thought signatures), then the tool results.
    contents.push({ role: "model", parts: modelParts });
    const responses: Part[] = [];
    for (const c of calls) {
      const fc = c.functionCall!;
      let result: unknown;
      try {
        result = await executeTool(fc.name ?? "", fc.args as Record<string, unknown>, req, emit);
      } catch {
        result = { error: "tool failed" };
      }
      responses.push({ functionResponse: { id: fc.id, name: fc.name, response: { result } } });
    }
    contents.push({ role: "user", parts: responses });
    if (round === MAX_ROUNDS - 1 && !emittedText) throw new Error("no_text");
  }
  if (!emittedText) throw new Error("empty");
}
