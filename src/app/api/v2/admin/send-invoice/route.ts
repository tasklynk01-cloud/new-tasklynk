import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

// Company branding information
const COMPANY_INFO = {
  name: 'TaskLynk',
  tagline: 'Professional Academic Writing Platform',
  address: 'Nairobi, Kenya',
  email: 'tasklynk01@gmail.com',
  phone: '+254701066845',
  website: 'www.tasklynk.co.ke',
};

// TaskLynk Brand Colors
const BRAND_COLORS = {
  navyBlue: '#1B3A5F',
  golden: '#F5A623',
  lightNavy: '#2D5582',
  lightGold: '#FFD278',
  creamBg: '#FFFBF5',
  lightBlueBg: '#F0F5FA',
};

interface OrderForInvoice {
  id: number;
  displayId: string;
  title: string;
  workType: string | null;
  pages: number | null;
  slides: number | null;
  totalAmount: number | null;
  createdAt: string | null;
  status: string | null;
}

// Generate invoice HTML email with embedded table (no PDF attachment needed - inline format)
function generateInvoiceEmailHTML(
  clientName: string,
  clientEmail: string,
  orders: OrderForInvoice[],
  totalAmount: number,
  invoiceNumber: string,
  customMessage?: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const orderRows = orders.map((order, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : BRAND_COLORS.lightBlueBg};">
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; color: ${BRAND_COLORS.navyBlue}; font-weight: 600;">${order.displayId}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #374151;">${order.title?.substring(0, 40)}${order.title && order.title.length > 40 ? '...' : ''}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #374151;">${order.workType || 'Standard'}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #374151;">${order.pages || '-'}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 14px; color: ${BRAND_COLORS.navyBlue};">KSh ${(order.totalAmount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber} - ${COMPANY_INFO.name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(27, 58, 95, 0.15);">
                
                <!-- Header with Logo and Company Info - Navy Blue with Golden Accent -->
                <tr>
                  <td style="background-color: ${BRAND_COLORS.navyBlue};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 30px 40px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" valign="middle">
                                <h1 style="margin: 0; color: ${BRAND_COLORS.golden}; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">${COMPANY_INFO.name}</h1>
                                <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">${COMPANY_INFO.tagline}</p>
                              </td>
                              <td width="50%" valign="top" align="right">
                                <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 13px;">${COMPANY_INFO.address}</p>
                                <p style="margin: 4px 0; color: rgba(255,255,255,0.85); font-size: 13px;">${COMPANY_INFO.email}</p>
                                <p style="margin: 4px 0; color: rgba(255,255,255,0.85); font-size: 13px;">${COMPANY_INFO.phone}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Golden Accent Stripe -->
                      <tr>
                        <td style="background-color: ${BRAND_COLORS.golden}; height: 5px;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Invoice Title Section -->
                <tr>
                  <td style="padding: 35px 40px 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top">
                          <h2 style="margin: 0; color: ${BRAND_COLORS.navyBlue}; font-size: 36px; font-weight: bold; letter-spacing: -1px;">INVOICE</h2>
                          <div style="width: 80px; height: 4px; background-color: ${BRAND_COLORS.golden}; margin-top: 8px; border-radius: 2px;"></div>
                        </td>
                        <td align="right" valign="top">
                          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.navyBlue} 0%, ${BRAND_COLORS.lightNavy} 100%); color: #ffffff; padding: 18px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(27, 58, 95, 0.25);">
                            <p style="margin: 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
                            <p style="margin: 6px 0 0; font-size: 28px; font-weight: bold; color: ${BRAND_COLORS.golden};">KSh ${totalAmount.toFixed(2)}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Invoice Details Box -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.creamBg}; border-radius: 10px; overflow: hidden;">
                      <tr>
                        <td style="width: 4px; background-color: ${BRAND_COLORS.golden};"></td>
                        <td style="padding: 20px 25px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" valign="top">
                                <p style="margin: 0 0 6px; color: ${BRAND_COLORS.golden}; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Bill To</p>
                                <p style="margin: 0; color: ${BRAND_COLORS.navyBlue}; font-size: 18px; font-weight: 700;">${clientName}</p>
                                <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${clientEmail}</p>
                              </td>
                              <td width="50%" valign="top" align="right">
                                <p style="margin: 0 0 6px; color: ${BRAND_COLORS.golden}; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Invoice Details</p>
                                <p style="margin: 0; color: ${BRAND_COLORS.navyBlue}; font-size: 14px;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                                <p style="margin: 4px 0; color: ${BRAND_COLORS.navyBlue}; font-size: 14px;"><strong>Date:</strong> ${currentDate}</p>
                                <p style="margin: 4px 0; color: ${BRAND_COLORS.navyBlue}; font-size: 14px;"><strong>Orders:</strong> ${orders.length}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${customMessage ? `
                <!-- Custom Message -->
                <tr>
                  <td style="padding: 0 40px 25px;">
                    <div style="background-color: ${BRAND_COLORS.lightBlueBg}; border-left: 4px solid ${BRAND_COLORS.navyBlue}; padding: 18px 22px; border-radius: 6px;">
                      <p style="margin: 0; color: ${BRAND_COLORS.navyBlue}; font-size: 14px; line-height: 1.7;">${customMessage}</p>
                    </div>
                  </td>
                </tr>
                ` : ''}

                <!-- Orders Table -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                      <thead>
                        <tr style="background-color: ${BRAND_COLORS.navyBlue};">
                          <th style="padding: 16px 15px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</th>
                          <th style="padding: 16px 15px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Title</th>
                          <th style="padding: 16px 15px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Type</th>
                          <th style="padding: 16px 15px; text-align: center; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pages</th>
                          <th style="padding: 16px 15px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${orderRows}
                      </tbody>
                      <tfoot>
                        <tr style="background-color: ${BRAND_COLORS.creamBg};">
                          <td colspan="4" style="padding: 18px 15px; text-align: right; font-weight: 700; font-size: 15px; color: ${BRAND_COLORS.navyBlue}; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount:</td>
                          <td style="padding: 18px 15px; text-align: right; font-weight: bold; font-size: 20px; color: ${BRAND_COLORS.golden};">KSh ${totalAmount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>
                </tr>

                <!-- Payment Instructions -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div style="background: linear-gradient(135deg, ${BRAND_COLORS.creamBg} 0%, #FFF8E7 100%); border-left: 4px solid ${BRAND_COLORS.golden}; padding: 22px 25px; border-radius: 6px;">
                      <h3 style="margin: 0 0 12px; color: ${BRAND_COLORS.navyBlue}; font-size: 16px; font-weight: 700;">💳 Payment Instructions</h3>
                      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
                        Please complete payment via M-Pesa to process your orders. Payment confirmation will be sent automatically once received. For any questions, contact us at <strong style="color: ${BRAND_COLORS.navyBlue};">${COMPANY_INFO.email}</strong>.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 0 40px 35px; text-align: center;">
                    <a href="https://tasklynk.co.ke/client/financial-overview" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLORS.navyBlue} 0%, ${BRAND_COLORS.lightNavy} 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 10px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(27, 58, 95, 0.3);">
                      View Your Account
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: ${BRAND_COLORS.navyBlue}; padding: 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <p style="margin: 0; color: ${BRAND_COLORS.golden}; font-size: 18px; font-weight: bold;">${COMPANY_INFO.name}</p>
                          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">
                            This invoice was generated automatically.
                          </p>
                          <p style="margin: 12px 0 0; color: rgba(255,255,255,0.65); font-size: 12px;">
                            © ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
                          </p>
                          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.65); font-size: 12px;">
                            ${COMPANY_INFO.address} | ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { clientId, orderIds, customMessage } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'At least one order must be selected' }, { status: 400 });
    }

    // Fetch client details
    const client = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientData = client[0];

    // Fetch selected orders
    const selectedOrders = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        workType: jobs.workType,
        pages: jobs.pages,
        slides: jobs.slides,
        totalAmount: jobs.amount,
        createdAt: jobs.createdAt,
        status: jobs.status,
      })
      .from(jobs)
      .where(inArray(jobs.id, orderIds));

    if (selectedOrders.length === 0) {
      return NextResponse.json({ error: 'No valid orders found' }, { status: 404 });
    }

    // Calculate total amount
    const totalAmount = selectedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    // Generate email HTML
    const emailHTML = generateInvoiceEmailHTML(
      clientData.name,
      clientData.email,
      selectedOrders,
      totalAmount,
      invoiceNumber,
      customMessage
    );

    // Send the invoice email
    const emailResult = await sendEmail({
      to: clientData.email,
      subject: `Invoice ${invoiceNumber} - ${selectedOrders.length} Order${selectedOrders.length > 1 ? 's' : ''} | ${COMPANY_INFO.name}`,
      html: emailHTML,
      category: 'order',
    });

    if (!emailResult.success) {
      console.error('Failed to send invoice email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send invoice email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceNumber} sent successfully to ${clientData.email}`,
      invoiceNumber,
      clientEmail: clientData.email,
      orderCount: selectedOrders.length,
      totalAmount,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch clients with pending/unpaid orders for invoice sending
export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      // Fetch orders for specific client
      const clientOrders = await db
        .select({
          id: jobs.id,
          displayId: jobs.displayId,
          title: jobs.title,
          workType: jobs.workType,
          pages: jobs.pages,
          slides: jobs.slides,
          totalAmount: jobs.amount,
          createdAt: jobs.createdAt,
          status: jobs.status,
        })
        .from(jobs)
        .where(eq(jobs.clientId, parseInt(clientId)));

      return NextResponse.json({ orders: clientOrders });
    }

    // Fetch all clients with orders
    const clientsWithOrders = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
      })
      .from(users)
      .where(eq(users.roleId, 2)); // Client role

    return NextResponse.json({ clients: clientsWithOrders });
  } catch (error) {
    console.error('Get invoice data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

