import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { adminMutation, deleteTraining, setTrainingStatus, upsertTraining } from "@/lib/db/admin";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("upsert"), id: z.string().max(40).nullable(), data: z.unknown() }),
  z.object({ action: z.literal("status"), id: z.string().max(40), status: z.enum(["pending", "approved"]) }),
  z.object({ action: z.literal("delete"), id: z.string().max(40) }),
]);

export const POST = adminPost("training", "training.view", Body, async (b, s) =>
  adminMutation((db) =>
    b.action === "upsert" ? upsertTraining(db, s, b.id, b.data) : b.action === "status" ? setTrainingStatus(db, s, b.id, b.status) : deleteTraining(db, s, b.id),
  ),
);
