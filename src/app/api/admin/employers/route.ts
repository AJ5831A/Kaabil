import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { adminMutation, createEmployer, decideEmployer, updateEmployer } from "@/lib/db/admin";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: z.unknown() }),
  z.object({ action: z.literal("update"), id: z.string().max(40), data: z.unknown() }),
  z.object({ action: z.literal("decide"), id: z.string().max(40), decision: z.enum(["verified", "rejected", "pending"]), notes: z.string().max(300).optional() }),
]);

export const POST = adminPost("employers", "employers.view", Body, async (b, s) =>
  adminMutation((db) =>
    b.action === "create" ? createEmployer(db, s, b.data) : b.action === "update" ? updateEmployer(db, s, b.id, b.data) : decideEmployer(db, s, b.id, b.decision, b.notes),
  ),
);
