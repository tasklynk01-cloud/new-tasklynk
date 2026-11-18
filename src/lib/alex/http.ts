import "server-only";
import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { count: number; expires: number }>();

/** Per-process protection. The deployment proxy MUST overwrite client IP headers. */
export function allowRequest(request: NextRequest, scope: string, limit: number): boolean {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const key = `${scope}:${ip.slice(0, 100)}`;
  const bucket = buckets.get(key);
  if (bucket) { bucket.count++; return bucket.count <= limit; }
  if (buckets.size >= 10000) return false;
  buckets.set(key, { count: 1, expires: now + 60000 });
  return true;
}

export function validOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  const allowed = new Set([
    "https://www.tasklynk.co.ke",
    "https://tasklynk.co.ke",
    "https://api.tasklynk.co.ke",
  ]);
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") {
    allowed.add("http://127.0.0.1:5000");
    allowed.add("http://localhost:5000");
    if (process.env.VERCEL_URL) {
      allowed.add(`https://${process.env.VERCEL_URL}`);
    }
  }
  // Explicit origins avoid depending on reverse-proxy or Next dev host rewriting.
  return allowed.has(origin);
}

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
}

export async function readSmallJson(request: NextRequest, maxBytes = 24000): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid content type");
  if (Number(request.headers.get("content-length")) > maxBytes) throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > maxBytes) { await reader.cancel(); throw new Error("Request too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function catalogueTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Unavailable")), 4000); })])
    .finally(() => clearTimeout(timer));
}
