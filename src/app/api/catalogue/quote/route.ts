import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages, users } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceSlug,
      serviceName,
      categorySlug,
      bundleSlug,
      clientName,
      clientEmail,
      clientPhone,
      deadline,
      projectScope,
      preferredSoftware,
      outputFormat,
      specificFields,
    } = body;

    if (!clientName || !clientEmail || (!serviceName && !bundleSlug)) {
      return NextResponse.json(
        { error: 'Name, email, and service/bundle selection are required' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const authUser = await getAuthenticatedUser(request);

    // Generate unique quote reference
    const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
    const quoteRef = `TL-Q${timestamp}`;

    const formattedContent = JSON.stringify({
      quoteReference: quoteRef,
      type: bundleSlug ? 'bundle_quotation' : 'service_quotation',
      serviceSlug: serviceSlug || null,
      serviceName: serviceName || bundleSlug,
      categorySlug: categorySlug || null,
      bundleSlug: bundleSlug || null,
      clientName,
      clientEmail,
      clientPhone: clientPhone || null,
      deadline: deadline || null,
      preferredSoftware: preferredSoftware || null,
      outputFormat: outputFormat || null,
      projectScope: projectScope || '',
      specificFields: specificFields || {},
      submittedAt: new Date().toISOString(),
      authenticatedUserId: authUser?.id || null,
    }, null, 2);

    // Save to contactMessages for operational admin triage
    const [inserted] = await db
      .insert(contactMessages)
      .values({
        senderName: `${clientName} [Quote: ${quoteRef}]`,
        senderEmail: clientEmail,
        senderPhone: clientPhone || null,
        content: formattedContent,
        status: 'pending',
        isGuest: !authUser,
      })
      .returning();

    return NextResponse.json({
      success: true,
      quoteReference: quoteRef,
      message: 'Quotation request submitted successfully. A project manager will review and provide a quotation within 2 to 4 hours.',
      id: inserted.id,
      quoteDetails: {
        service: serviceName || bundleSlug,
        deadline,
        clientEmail,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/catalogue/quote] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process quotation request', details: error.message },
      { status: 500 }
    );
  }
}

