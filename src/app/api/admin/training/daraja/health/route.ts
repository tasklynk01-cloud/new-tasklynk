import { NextRequest, NextResponse } from 'next/server';
import { getDarajaHealthReport } from '@/lib/training-service';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const report = await getDarajaHealthReport();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Error checking Daraja health status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
