import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    let value = true;
    try {
      const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, 'writer_hiring_enabled'));
      if (rows && rows.length) {
        value = rows[0].value === 'true' || rows[0].value === '1';
      }
    } catch {}
    return NextResponse.json({ writer_hiring_enabled: value });
  } catch {
    return NextResponse.json({ writer_hiring_enabled: true });
  }
}
