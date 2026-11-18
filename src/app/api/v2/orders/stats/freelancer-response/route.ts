import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    // Fetch statistics from freelancer_order_responses table
    const result = await db.execute(sql`
        SELECT
          COUNT(*) as total_responses,
          SUM(CASE WHEN response_status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
          SUM(CASE WHEN response_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          AVG(response_time_minutes) as avg_response_time
        FROM freelancer_order_responses
        WHERE freelancer_id = ${freelancerId}
      `);

    const row = result.rows[0];
    
    const totalResponses = Number(row.total_responses || 0);
    const acceptedCount = Number(row.accepted_count || 0);
    const rejectedCount = Number(row.rejected_count || 0);
    const avgResponseTime = Number(row.avg_response_time || 0);

    const acceptanceRate = totalResponses > 0 ? (acceptedCount / totalResponses) * 100 : 0;
    const rejectionRate = totalResponses > 0 ? (rejectedCount / totalResponses) * 100 : 0;

    return NextResponse.json({
      totalResponses,
      acceptedCount,
      rejectedCount,
      acceptanceRate,
      rejectionRate,
      averageResponseTimeSeconds: avgResponseTime,
    });
  } catch (error) {
    console.error('Failed to fetch freelancer response stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

