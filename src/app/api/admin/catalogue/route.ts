import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, contactMessages } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { 
  getAllServices, 
  getAllBundles, 
  applyServiceOverride, 
  applyBundleOverride, 
  CATEGORIES 
} from '@/lib/catalogue';
import { eq, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const services = getAllServices(true);
    const bundles = getAllBundles(true);

    // Fetch incoming quote inquiries count from contactMessages
    const [quoteCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(sql`${contactMessages.senderName} LIKE '%[Quote:%'`);

    // Fetch recent order counts and financial performance
    const [ordersSummary] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(amount), 0)`,
        avgRating: sql<number>`coalesce(avg(client_rating), 5.0)`,
      })
      .from(jobs);

    // Fetch recent quote requests
    const recentQuotes = await db
      .select()
      .from(contactMessages)
      .where(sql`${contactMessages.senderName} LIKE '%[Quote:%'`)
      .orderBy(desc(contactMessages.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      categories: CATEGORIES,
      services,
      bundles,
      analytics: {
        totalCatalogueServices: services.length,
        publishedCount: services.filter((s) => s.published).length,
        orderableCount: services.filter((s) => s.orderable).length,
        totalQuotationRequests: Number(quoteCountResult?.count || 0),
        totalOrders: Number(ordersSummary?.totalOrders || 0),
        totalRevenueKSh: Number(ordersSummary?.totalRevenue || 0),
        averageSatisfactionRating: Number(Number(ordersSummary?.avgRating || 5).toFixed(1)),
      },
      recentQuotes,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/catalogue] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalogue data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { 
      type, 
      slug, 
      published, 
      orderable, 
      startingPrice, 
      minimumPrice, 
      turnaround, 
      revisionPolicy,
      discountPercent,
      summary 
    } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Service or bundle slug required' }, { status: 400 });
    }

    if (type === 'bundle') {
      applyBundleOverride({
        bundleSlug: slug,
        published,
        orderable,
        discountPercent,
        turnaround,
      });
      return NextResponse.json({ success: true, message: `Bundle ${slug} updated` });
    } else {
      applyServiceOverride({
        serviceSlug: slug,
        published,
        orderable,
        startingPrice,
        minimumPrice,
        turnaround,
        revisionPolicy,
        summary,
      });
      return NextResponse.json({ success: true, message: `Service ${slug} updated` });
    }
  } catch (error: any) {
    console.error('[PATCH /api/admin/catalogue] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update catalogue item', details: error.message },
      { status: 500 }
    );
  }
}

