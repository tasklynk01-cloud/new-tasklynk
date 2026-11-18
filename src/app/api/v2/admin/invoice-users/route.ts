import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, and, desc, inArray, sql, like, or } from 'drizzle-orm';
import { 
  calculateWriterEarningsByCPPLevel, 
  managerAssignFee, 
  managerSubmitFee 
} from '@/lib/payment-calculations';
import { sendEmail } from '@/lib/email';

// Brand colors for email template
const BRAND_COLORS = {
  navyBlue: '#1B3A5F',
  golden: '#F5A623',
  cream: '#FFF8E7',
  lightNavy: '#2C4F7C'
};

const COMPANY_INFO = {
  name: 'TaskLynk Academic Services',
  tagline: 'Professional Academic Writing Solutions',
  email: 'admn@tasklynk.co.ke',
  phone: '+254 700 000 000',
  website: 'www.tasklynk.co.ke',
  address: 'Nairobi, Kenya'
};

// Role ID mapping
const ROLE_MAP: Record<string, number> = {
  admin: 1,
  client: 2,
  manager: 3,
  freelancer: 4,
  editor: 5,
  account_owner: 6,
};

/**
 * GET /api/v2/admin/invoice-users
 * Fetches users by type or orders for a specific user
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const userType = searchParams.get('userType') || 'client';
  const userId = searchParams.get('userId');
  const searchQuery = searchParams.get('search');

  try {
    // If userId is provided, fetch orders for that user
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1);

      if (!userResult.length) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const targetUser = userResult[0];
      let orders: any[] = [];

      if (userType === 'client') {
        // Get client's orders (pending payment or completed)
        const clientOrders = await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            title: jobs.title,
            workType: jobs.workType,
            pages: jobs.pages,
            slides: jobs.slides,
            amount: jobs.amount,
            createdAt: jobs.createdAt,
            status: jobs.status,
            paymentConfirmed: jobs.paymentConfirmed,
            freelancerId: jobs.assignedFreelancerId,
          })
          .from(jobs)
          .where(eq(jobs.clientId, userIdNum))
          .orderBy(desc(jobs.createdAt));

        // Get freelancer names
        const freelancerIds = [...new Set(clientOrders.filter(o => o.freelancerId).map(o => o.freelancerId!))];
        let freelancerNames: Record<number, string> = {};
        
        if (freelancerIds.length > 0) {
          const freelancers = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, freelancerIds));
          freelancerNames = Object.fromEntries(freelancers.map(f => [f.id, f.name]));
        }

        orders = clientOrders.map(order => ({
          id: order.id,
          displayId: order.displayId || `TL-${order.id}`,
          title: order.title,
          workType: order.workType,
          pages: order.pages,
          slides: order.slides,
          amount: order.amount || 0,
          createdAt: order.createdAt,
          status: order.status,
          paymentConfirmed: order.paymentConfirmed,
          freelancerName: order.freelancerId ? freelancerNames[order.freelancerId] : null,
        }));

      } else if (userType === 'freelancer') {
        // Get freelancer's completed orders and calculate earnings
        const freelancerOrders = await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            title: jobs.title,
            workType: jobs.workType,
            pages: jobs.pages,
            slides: jobs.slides,
            singleSpaced: jobs.singleSpaced,
            createdAt: jobs.createdAt,
            status: jobs.status,
            clientId: jobs.clientId,
          })
          .from(jobs)
          .where(
            and(
              eq(jobs.assignedFreelancerId, userIdNum),
              inArray(jobs.status, ['completed', 'delivered', 'approved', 'paid'])
            )
          )
          .orderBy(desc(jobs.createdAt));

        // Get client names
        const clientIds = [...new Set(freelancerOrders.filter(o => o.clientId).map(o => o.clientId!))];
        let clientNames: Record<number, string> = {};
        
        if (clientIds.length > 0) {
          const clients = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, clientIds));
          clientNames = Object.fromEntries(clients.map(c => [c.id, c.name]));
        }

        // Count completed orders for CPP level calculation
        const completedCount = freelancerOrders.filter(o => o.status === 'completed').length;

        orders = freelancerOrders.map(order => {
          const earnings = calculateWriterEarningsByCPPLevel(
            order.pages || 0,
            order.slides || 0,
            order.workType || 'Standard',
            completedCount,
            Boolean(order.singleSpaced)  // 🔴 Include single-spaced flag
          );
          return {
            id: order.id,
            displayId: order.displayId || `TL-${order.id}`,
            title: order.title,
            workType: order.workType,
            pages: order.pages,
            slides: order.slides,
            amount: earnings,
            createdAt: order.createdAt,
            status: order.status,
            clientName: order.clientId ? clientNames[order.clientId] : null,
          };
        });

      } else if (userType === 'manager') {
        // Get manager's assigned orders and calculate commissions
        const managerOrders = await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            title: jobs.title,
            workType: jobs.workType,
            pages: jobs.pages,
            slides: jobs.slides,
            singleSpaced: jobs.singleSpaced,
            createdAt: jobs.createdAt,
            status: jobs.status,
            clientId: jobs.clientId,
            freelancerId: jobs.assignedFreelancerId,
          })
          .from(jobs)
          .where(
            and(
              eq(jobs.managerId, userIdNum),
              inArray(jobs.status, ['completed', 'delivered', 'approved', 'paid', 'in_progress'])
            )
          )
          .orderBy(desc(jobs.createdAt));

        // Get user names
        const allUserIds = [
          ...new Set([
            ...managerOrders.filter(o => o.clientId).map(o => o.clientId!),
            ...managerOrders.filter(o => o.freelancerId).map(o => o.freelancerId!),
          ])
        ];
        let userNames: Record<number, string> = {};
        
        if (allUserIds.length > 0) {
          const allUsers = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, allUserIds));
          userNames = Object.fromEntries(allUsers.map(u => [u.id, u.name]));
        }

        orders = managerOrders.map(order => {
          // Manager earns assign fee + submit fee
          // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
          const assignFee = managerAssignFee();
          const submitFee = managerSubmitFee(order.pages || 0, Boolean(order.singleSpaced));
          const totalCommission = assignFee + submitFee;

          return {
            id: order.id,
            displayId: order.displayId || `TL-${order.id}`,
            title: order.title,
            workType: order.workType,
            pages: order.pages,
            slides: order.slides,
            amount: totalCommission,
            createdAt: order.createdAt,
            status: order.status,
            clientName: order.clientId ? userNames[order.clientId] : null,
            freelancerName: order.freelancerId ? userNames[order.freelancerId] : null,
          };
        });
      }

      return NextResponse.json({
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          displayId: targetUser.displayId,
        },
        orders,
      });
    }

    // Otherwise, fetch users of the specified type
    const roleId = ROLE_MAP[userType];
    if (!roleId) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
        role: users.role,
        roleId: users.roleId,
      })
      .from(users)
      .where(
        and(
          eq(users.roleId, roleId),
          eq(users.approved, true)
        )
      )
      .orderBy(users.name);

    const usersList = await query;

    return NextResponse.json({
      users: usersList.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        displayId: u.displayId || `${userType.toUpperCase().slice(0, 3)}-${u.id}`,
        role: u.role,
        roleId: u.roleId,
      })),
    });

  } catch (error) {
    console.error('Error fetching invoice users:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST /api/v2/admin/invoice-users
 * Sends an invoice email to the specified user
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { userId, orderIds, userType, customMessage } = body;

    if (!userId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'User ID and at least one order are required' },
        { status: 400 }
      );
    }

    // Get user info
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = userResult[0];

    // Get orders
    const orderResult = await db
      .select()
      .from(jobs)
      .where(inArray(jobs.id, orderIds));

    if (orderResult.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Calculate totals based on user type
    let totalAmount = 0;
    const orderDetails = [];

    // Count completed orders for freelancer CPP calculation
    let completedCount = 0;
    if (userType === 'freelancer') {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(
          and(
            eq(jobs.assignedFreelancerId, userId),
            eq(jobs.status, 'completed')
          )
        );
      completedCount = countResult[0]?.count || 0;
    }

    for (const order of orderResult) {
      let amount = 0;

      if (userType === 'client') {
        amount = order.amount || 0;
      } else if (userType === 'freelancer') {
        amount = calculateWriterEarningsByCPPLevel(
          order.pages || 0,
          order.slides || 0,
          order.workType || 'Standard',
          completedCount,
          Boolean(order.singleSpaced)  // 🔴 Include single-spaced flag
        );
      } else if (userType === 'manager') {
        const assignFee = managerAssignFee();
        // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
        const submitFee = managerSubmitFee(order.pages || 0, Boolean(order.singleSpaced));
        amount = assignFee + submitFee;
      }

      totalAmount += amount;
      orderDetails.push({
        displayId: order.displayId || `TL-${order.id}`,
        title: order.title,
        workType: order.workType || 'Standard',
        pages: order.pages || 0,
        slides: order.slides || 0,
        amount,
        status: order.status,
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${userId}`;
    const invoiceDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Determine invoice type description
    const invoiceTypeDesc = userType === 'client' 
      ? 'Payment Invoice' 
      : userType === 'freelancer' 
        ? 'Earnings Statement' 
        : 'Commission Statement';

    // Build email HTML with brand styling
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${invoiceTypeDesc} - ${COMPANY_INFO.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.navyBlue} 0%, ${BRAND_COLORS.lightNavy} 100%); padding: 30px 40px;">
              <table width="100%">
                <tr>
                  <td>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">TaskLynk</h1>
                    <p style="color: ${BRAND_COLORS.golden}; margin: 5px 0 0 0; font-size: 14px;">${COMPANY_INFO.tagline}</p>
                  </td>
                  <td align="right">
                    <div style="background-color: ${BRAND_COLORS.golden}; color: ${BRAND_COLORS.navyBlue}; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;">
                      ${invoiceTypeDesc.toUpperCase()}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Golden accent stripe -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.golden}; height: 4px;"></td>
          </tr>

          <!-- Invoice Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <table width="100%">
                <tr>
                  <td width="50%" style="vertical-align: top;">
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Invoice To</p>
                    <p style="color: ${BRAND_COLORS.navyBlue}; font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">${targetUser.name}</p>
                    <p style="color: #666; font-size: 14px; margin: 0;">${targetUser.email}</p>
                  </td>
                  <td width="50%" style="vertical-align: top; text-align: right;">
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">Invoice #</p>
                    <p style="color: ${BRAND_COLORS.navyBlue}; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">${invoiceNumber}</p>
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">Date</p>
                    <p style="color: #666; font-size: 14px; margin: 0;">${invoiceDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Custom Message -->
          ${customMessage ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: ${BRAND_COLORS.cream}; border-left: 4px solid ${BRAND_COLORS.golden}; padding: 15px 20px; border-radius: 0 4px 4px 0;">
                <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">${customMessage}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Order Details Table -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: ${BRAND_COLORS.navyBlue};">
                  <th style="color: #ffffff; padding: 12px 15px; text-align: left; font-size: 12px; text-transform: uppercase;">Order ID</th>
                  <th style="color: #ffffff; padding: 12px 15px; text-align: left; font-size: 12px; text-transform: uppercase;">Description</th>
                  <th style="color: #ffffff; padding: 12px 15px; text-align: right; font-size: 12px; text-transform: uppercase;">Amount</th>
                </tr>
                ${orderDetails.map((order, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                  <td style="padding: 12px 15px; font-size: 13px; color: ${BRAND_COLORS.navyBlue}; font-weight: 600;">${order.displayId}</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #666;">
                    ${order.title.substring(0, 40)}${order.title.length > 40 ? '...' : ''}<br>
                    <span style="color: #999; font-size: 11px;">${order.workType} • ${order.pages > 0 ? `${order.pages} pages` : ''} ${order.slides > 0 ? `${order.slides} slides` : ''}</span>
                  </td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #333; text-align: right; font-weight: 500;">KSh ${order.amount.toFixed(2)}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" style="background: linear-gradient(135deg, ${BRAND_COLORS.navyBlue} 0%, ${BRAND_COLORS.lightNavy} 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <table width="100%">
                      <tr>
                        <td>
                          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Total ${userType === 'client' ? 'Amount Due' : 'Earnings'}</p>
                        </td>
                        <td style="text-align: right;">
                          <p style="color: ${BRAND_COLORS.golden}; margin: 0; font-size: 28px; font-weight: bold;">KSh ${totalAmount.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 25px 40px; border-top: 1px solid #eee;">
              <table width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: ${BRAND_COLORS.navyBlue}; font-weight: bold; margin: 0 0 5px 0;">${COMPANY_INFO.name}</p>
                    <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">${COMPANY_INFO.address}</p>
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      <a href="mailto:${COMPANY_INFO.email}" style="color: ${BRAND_COLORS.navyBlue};">${COMPANY_INFO.email}</a> | 
                      <a href="https://${COMPANY_INFO.website}" style="color: ${BRAND_COLORS.navyBlue};">${COMPANY_INFO.website}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Footer note -->
        <p style="color: #999; font-size: 11px; margin-top: 20px; text-align: center;">
          This invoice was generated by TaskLynk on ${invoiceDate}. Please keep this for your records.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using centralized email service
    const emailResult = await sendEmail({
      to: targetUser.email,
      subject: `${invoiceTypeDesc} #${invoiceNumber} - ${COMPANY_INFO.name}`,
      html: emailHtml,
      category: 'order',
    });

    if (!emailResult.success) {
      console.error('Failed to send invoice email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send invoice email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invoiceNumber,
      email: targetUser.email,
      orderCount: orderDetails.length,
      totalAmount,
      messageId: emailResult.messageId,
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}

