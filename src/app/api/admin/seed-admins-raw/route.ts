import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST() {
  try {

    const admins = [
      { email: "topwriteessays@gmail.com", name: "Admin User 1" },
      { email: "m.d.techpoint25@gmail.com", name: "Admin User 2" },
      { email: "maguna956@gmail.com", name: "Admin User 3" },
      { email: "tasklynk01@gmail.com", name: "Admin User 4" },
      { email: "maxwellotieno11@gmail.com", name: "Admin User 5" },
      { email: "ashleydothy3162@gmail.com", name: "Admin User 6" },
    ];

    const passwordHash = await bcrypt.hash("kemoda2025", 10);
    const now = new Date().toISOString();

    const inserted: string[] = [];
    const skipped: string[] = [];

    // Ensure table exists minimally by probing
    await db.execute(sql`SELECT 1 FROM users LIMIT 1`);

    for (let i = 0; i < admins.length; i++) {
      const a = admins[i];
      const displayId = `ADMN#${String(i + 1).padStart(4, "0")}`;

      await db.execute(sql`INSERT INTO users (display_id, email, password, name, role, approved, balance, phone, status, created_at, updated_at) VALUES (${displayId}, ${a.email}, ${passwordHash}, ${a.name}, 'admin', 1, 0, ${`+2547000000${i + 1}`}, 'active', ${now}, ${now}) ON CONFLICT (email) DO NOTHING`);

      // Check if row exists now
      const check = await db.execute(sql`SELECT id FROM users WHERE email = ${a.email} LIMIT 1`);
      if (check.rows.length > 0) inserted.push(a.email); else skipped.push(a.email);
    }

    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

