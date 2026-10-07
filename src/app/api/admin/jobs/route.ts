import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { adminMutation, createJob, setJobStatus, updateJob } from "@/lib/db/admin";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: z.unknown() }),
  z.object({ action: z.literal("update"), id: z.string().max(40), data: z.unknown() }),
  z.object({ action: z.literal("status"), id: z.string().max(40), status: z.enum(["approved", "rejected", "archived", "pending"]), note: z.string().max(300).optional() }),
]);

export const POST = adminPost("jobs", "jobs.view", Body, async (b, s) =>
  adminMutation((db) =>
    b.action === "create" ? createJob(db, s, b.data) : b.action === "update" ? updateJob(db, s, b.id, b.data) : setJobStatus(db, s, b.id, b.status, b.note),
  ),
);
