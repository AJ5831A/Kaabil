import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { adminMutation, archiveFromReport, setReportStatus } from "@/lib/db/admin";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string().max(40), status: z.enum(["open", "resolved", "dismissed"]) }),
  z.object({ action: z.literal("archive"), id: z.string().max(40) }),
]);

export const POST = adminPost("reports", "reports.view", Body, async (b, s) =>
  adminMutation((db) => (b.action === "status" ? setReportStatus(db, s, b.id, b.status) : archiveFromReport(db, s, b.id))),
);
