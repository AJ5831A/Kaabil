import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { adminMutation, upsertStation } from "@/lib/db/admin";

const Body = z.object({ action: z.literal("upsert"), id: z.string().max(40).nullable(), data: z.unknown() });

export const POST = adminPost("stations", "stations.view", Body, async (b, s) => adminMutation((db) => upsertStation(db, s, b.id, b.data)));
