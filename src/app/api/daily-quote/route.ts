import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateDailyQuote } from '@/lib/quotes/daily-quotes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const refresh = searchParams.get('refresh') === 'true';

  try {
    const quote = await getOrGenerateDailyQuote(refresh);
    return NextResponse.json(quote, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API Daily Quote Error]:', error);
    return NextResponse.json(
      {
        quote: 'In God we trust. All others must bring data.',
        author: 'W. Edwards Deming',
        category: 'Data & Statistics',
        date: new Date().toISOString().split('T')[0],
        generatedBy: 'curated',
      },
      { status: 200 }
    );
  }
}

