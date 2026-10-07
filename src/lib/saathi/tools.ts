import { HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS, STRENGTHS } from "@/lib/taxonomy";
import { TOWNS } from "@/lib/geo/towns";
import { SCREENS } from "./types";

/** Gemini function declarations (JSON Schema). Execution lives in ./engine.ts (server). */
export const TOOL_DECLARATIONS = [
  {
    name: "search_jobs",
    description: "Search ADMIN-APPROVED job listings. Results are shown to the user as job tiles automatically. Returns only real records.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        skill: { type: "string", enum: [...SKILLS], description: "Skill the job needs" },
        category: { type: "string", enum: JOB_CATEGORIES.map((c) => c.key) },
        townId: { type: "string", enum: TOWNS.map((t) => t.id), description: "Town to search around" },
        maxDistanceKm: { type: "number", description: "How far the user can travel (km)" },
        type: { type: "string", enum: [...JOB_TYPES] },
        hoursBand: { type: "string", enum: [...HOURS_BANDS] },
        minPay: { type: "number" },
        verifiedOnly: { type: "boolean" },
      },
    },
  },
  {
    name: "get_job_details",
    description: "Get full details of one approved job by id (pay, hours, skills, training, verification).",
    parametersJsonSchema: { type: "object", properties: { jobId: { type: "string" } }, required: ["jobId"] },
  },
  {
    name: "compare_jobs",
    description: "Compare 2–3 approved jobs side by side. Shows a comparison table to the user.",
    parametersJsonSchema: { type: "object", properties: { jobIds: { type: "array", items: { type: "string" }, maxItems: 3 } }, required: ["jobIds"] },
  },
  {
    name: "list_skills",
    description: "List the learnable skill courses in KAABIL (beginner level, local language, audio). Shows skill tiles.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_lesson",
    description: "Get a course (and optionally one lesson) to explain or answer questions while learning.",
    parametersJsonSchema: { type: "object", properties: { courseId: { type: "string" }, skill: { type: "string", enum: [...SKILLS] }, lessonId: { type: "string" } } },
  },
  {
    name: "save_skill_profile",
    description: "Save things the user says about their abilities to their on-device KAABIL profile.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        skills: { type: "array", items: { type: "string", enum: [...SKILLS] } },
        strengths: { type: "array", items: { type: "string", enum: [...STRENGTHS] } },
        experience: { type: "string", description: "Short description of previous work in the user's words" },
        townId: { type: "string", enum: TOWNS.map((t) => t.id) },
        maxDistanceKm: { type: "number" },
        jobType: { type: "string", enum: [...JOB_TYPES] },
        hoursBand: { type: "string", enum: [...HOURS_BANDS] },
      },
    },
  },
  {
    name: "add_to_parchi",
    description: "Add an approved job to the user's 'My Job Options' parchi for printing.",
    parametersJsonSchema: { type: "object", properties: { jobId: { type: "string" } }, required: ["jobId"] },
  },
  {
    name: "find_training",
    description: "Find approved training programmes, optionally for a skill and near a town. Shows cards.",
    parametersJsonSchema: { type: "object", properties: { skill: { type: "string", enum: [...SKILLS] }, townId: { type: "string", enum: TOWNS.map((t) => t.id) } } },
  },
  {
    name: "find_stations",
    description: "Find KAABIL Stations (community kiosks with a helper and often a printer).",
    parametersJsonSchema: { type: "object", properties: { townId: { type: "string", enum: TOWNS.map((t) => t.id) } } },
  },
  {
    name: "navigate_to_screen",
    description: "Open a screen in the app for the user.",
    parametersJsonSchema: {
      type: "object",
      properties: { screen: { type: "string", enum: [...Object.keys(SCREENS), "job", "course"] }, jobId: { type: "string", description: "Only for screen=job" }, courseId: { type: "string", description: "Only for screen=course" } },
      required: ["screen"],
    },
  },
  {
    name: "print_parchi",
    description: "Open the print preview for the user's KAABIL Parchi (profile), My Job Options, or one Job Parchi.",
    parametersJsonSchema: { type: "object", properties: { which: { type: "string", enum: ["profile", "options", "job"] }, jobId: { type: "string" } }, required: ["which"] },
  },
  {
    name: "report_listing",
    description: "Help the user report a suspicious or incorrect job listing (opens the report form).",
    parametersJsonSchema: { type: "object", properties: { jobId: { type: "string" } }, required: ["jobId"] },
  },
  {
    name: "suggest_replies",
    description: "Show 2–6 short tappable quick replies for the user's next answer.",
    parametersJsonSchema: { type: "object", properties: { options: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 } }, required: ["options"] },
  },
];

export type ToolName = (typeof TOOL_DECLARATIONS)[number]["name"];
