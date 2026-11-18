import { NextRequest } from "next/server";
import { and, like, lt, sql } from "drizzle-orm";
import { ANALYTICS_EVENTS } from "@/lib/alex/types";
import { allowRequest, json, readSmallJson, validOrigin } from "@/lib/alex/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return json({ error: "Not allowed" }, 403);
  if (!allowRequest(request, "alex-events", 30)) return json({ error: "Please try later" }, 429);
  if (process.env.ALEX_ANALYTICS_ENABLED !== "true" || request.headers.get("dnt") === "1") return json({ recorded: false });
  let body: { event?: unknown };
  try { body = await readSmallJson(request, 256) as typeof body; } catch { return json({ error: "Invalid event" }, 400); }
  if (!body || !ANALYTICS_EVENTS.includes(body.event as never)) return json({ error: "Invalid event" }, 400);
  try {
    const { db } = await import("@/db");
    const { systemSettings } = await import("@/db/schema");
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    await db.transaction(async transaction => {
      await transaction.delete(systemSettings).where(and(like(systemSettings.key, "alex.metrics.%"), lt(systemSettings.key, `alex.metrics.${cutoff}`)));
      await transaction.insert(systemSettings).values({ key: `alex.metrics.${today}.${body.event}`, value: "1", type: "number" })
        .onConflictDoUpdate({ target: systemSettings.key, set: { value: sql`((${systemSettings.value})::integer + 1)::text`, updatedAt: new Date().toISOString() } });
    });
    return json({ recorded: true });
  } catch { return json({ recorded: false }); }
}

export async function GET(request: NextRequest) {
  const { requireRole } = await import("@/lib/admin-auth");
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return json({ error: "Not authorised" }, auth.status || 403);
  const { db } = await import("@/db");
  const { systemSettings } = await import("@/db/schema");
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const counts = await db.select({ key: systemSettings.key, count: systemSettings.value }).from(systemSettings)
    .where(and(like(systemSettings.key, "alex.metrics.%"), sql`${systemSettings.key} >= ${`alex.metrics.${cutoff}`}`));
  return json({ counts, retentionDays: 30, note: "Opt-in aggregate events, not verified paid-order attribution. Counts are not unique users." });
}