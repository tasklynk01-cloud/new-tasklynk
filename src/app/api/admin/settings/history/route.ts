import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { settingsHistory } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET - Fetch settings change history
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const settingKey = searchParams.get('settingKey');

    // Build query
    let query;
    if (settingKey) {
      query = db
        .select()
        .from(settingsHistory)
        .where(eq(settingsHistory.settingKey, settingKey))
        .orderBy(desc(settingsHistory.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      query = db
        .select()
        .from(settingsHistory)
        .orderBy(desc(settingsHistory.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const history = await query;

    // Get total count
    const allHistory = settingKey 
      ? await db.select().from(settingsHistory).where(eq(settingsHistory.settingKey, settingKey))
      : await db.select().from(settingsHistory);
    
    return NextResponse.json({
      history,
      total: allHistory.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings history' },
      { status: 500 }
    );
  }
}

