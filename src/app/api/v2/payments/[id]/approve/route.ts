import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, jobs, users, notifications, auditLogs, invoices } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';

/**
 * POST /api/v2/payments/[id]/approve
 * 
 * Admin approves a Paystack payment after verification
 * 
 * This endpoint:
 * 1. Verifies payment is pending verification
 * 2. Marks payment as confirmed by admin
 * 3. Updates job status to 'paid' if applicable
 * 4. Calculates and distributes earnings
 * 5. Sends notifications to all parties
 * 6. Creates audit log entry
 * 
 * Auth: Requires admin role
 * 
 * Body:
 * {
 *   verificationNotes?: string,  // Optional admin notes about verification
 *   actualAmount?: number,       // Optional - if different from recorded amount
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   data: {
 *     payment: { ... updated payment record },
 *     job: { ... updated job record } | null,
 *     distribution: {
 *       freelancer: number,
 *       manager: number,
 *       admin: number
 *     } | null
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.user!;

  try {
    const { id } = await params;
    const paymentId = parseInt(id);
    const body = await request.json().catch(() => ({}));
    const { verificationNotes, actualAmount } = body;

    if (Number.isNaN(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // Fetch payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify payment is pending verification
    if (payment.status !== 'pending_verification' && payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Payment already ${payment.status}. Cannot approve again.` },
        { status: 400 }
      );
    }

    // Verify it's a Paystack payment
    if (payment.paymentMethod !== 'paystack') {
      return NextResponse.json(
        { error: 'This endpoint is only for Paystack payments' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const amountToConfirm = actualAmount || payment.amount;

    // Update payment record to confirmed
    await db
      .update(payments)
      .set({
        status: 'confirmed',
        confirmedByAdmin: true,
        confirmedAt: now,
        amount: amountToConfirm, // Update if actual amount differs
        adminVerificationCode: verificationNotes || `Verified by admin ${admin.name} via Paystack`,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    let updatedJob = null;
    let distribution = null;

    // Update job if applicable
    if (payment.jobId) {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, payment.jobId))
        .limit(1);

      if (job && job.status !== 'paid' && job.status !== 'completed' && job.status !== 'cancelled') {
        // Calculate freelancer earnings
        const freelancerId = job.assignedFreelancerId;
        let freelancerEarnings = 0;
        let resolvedManagerId = job.managerId ?? null;

        if (freelancerId) {
          const [freelancer] = await db
            .select()
            .from(users)
            .where(eq(users.id, freelancerId))
            .limit(1);

          if (freelancer) {
            freelancerEarnings = calculateWriterEarningsByCPPLevel(
              job.pages,
              job.slides,
              job.workType,
              freelancer.completedJobs || 0,
              job.singleSpaced || false
            );

            if (!resolvedManagerId) {
              resolvedManagerId = freelancer.assignedManagerId ?? null;
            }
          }
        }

        if (!resolvedManagerId) {
          const [clientRecord] = await db
            .select()
            .from(users)
            .where(eq(users.id, payment.clientId))
            .limit(1);
          resolvedManagerId = clientRecord?.assignedManagerId ?? null;
        }

        const managerEarnings = Number(job.managerEarnings || 0) > 0
          ? Number(job.managerEarnings || 0)
          : Number(job.managerAssignedFee || 0) + Number(job.managerDeliveryFee || 0);
        const adminProfit = Math.max(0, amountToConfirm - freelancerEarnings - managerEarnings);

        // Update job status to paid
        await db
          .update(jobs)
          .set({
            status: 'paid',
            paymentConfirmed: true,
            freelancerEarnings,
            managerEarnings,
            adminProfit,
            managerId: resolvedManagerId,
            amount: amountToConfirm,
            statusTotalAmount: amountToConfirm,
            paidAt: now,
            updatedAt: now,
          })
          .where(eq(jobs.id, payment.jobId));

        // Fetch updated job
        [updatedJob] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, payment.jobId))
          .limit(1);

        distribution = {
          freelancer: freelancerEarnings,
          manager: managerEarnings,
          admin: adminProfit,
        };

        // Notify freelancer
        if (freelancerId) {
          await db.insert(notifications).values({
            userId: freelancerId,
            jobId: payment.jobId,
            type: 'payment_confirmed',
            title: '✅ Payment Confirmed',
            message: `Admin verified payment for order #${job.displayId || job.id}. Your earnings: KSh ${freelancerEarnings.toFixed(2)}`,
            createdAt: now,
          });
        }

        // Notify manager if exists
        if (resolvedManagerId) {
          await db.insert(notifications).values({
            userId: resolvedManagerId,
            jobId: payment.jobId,
            type: 'payment_confirmed',
            title: '✅ Payment Confirmed',
            message: `Admin verified payment for order #${job.displayId || job.id}. Your fees: KSh ${distribution.manager.toFixed(2)}`,
            createdAt: now,
          });
        }

        // Notify client
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_confirmed',
          title: '✅ Payment Confirmed',
          message: `Your payment of KSh ${amountToConfirm.toFixed(2)} has been verified for order #${job.displayId || job.id}`,
          createdAt: now,
        });

        const [existingInvoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.jobId, payment.jobId))
          .limit(1);

        if (!existingInvoice) {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
          const todayInvoices = await db
            .select()
            .from(invoices)
            .where(gte(invoices.createdAt, startOfDay));
          const sequenceNum = (todayInvoices.length + 1).toString().padStart(5, '0');
          const invoiceNumber = `INV-${dateStr}-${sequenceNum}`;

          await db.insert(invoices).values({
            jobId: payment.jobId,
            clientId: payment.clientId,
            freelancerId: freelancerId || null,
            invoiceNumber,
            amount: amountToConfirm,
            freelancerAmount: freelancerEarnings,
            managerAmount: managerEarnings,
            adminCommission: adminProfit,
            companyFee: 0,
            managerAdditionalIncluded: 0,
            clientBonusIncluded: 0,
            description: `Payment for order ${job.displayId || job.orderNumber || payment.jobId}`,
            status: 'pending',
            isPaid: false,
            paidAt: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    } else {
      // Wallet top-up - update client balance
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);
      
      if (client) {
        const newBalance = (client.balance || 0) + amountToConfirm;
        await db
          .update(users)
          .set({ 
            balance: newBalance,
            totalSpent: (client.totalSpent || 0) + amountToConfirm,
            updatedAt: now 
          })
          .where(eq(users.id, payment.clientId));
        
        console.log(`[Payment Approve] Updated client ${payment.clientId} balance: ${newBalance} KSh (+${amountToConfirm} KSh)`);
      }

      // Notify client
      await db.insert(notifications).values({
        userId: payment.clientId,
        type: 'payment_confirmed',
        title: '✅ Wallet Top-up Confirmed',
        message: `Your Paystack payment of KSh ${amountToConfirm.toFixed(2)} has been verified and added to your wallet. New balance: KSh ${((client?.balance || 0) + amountToConfirm).toFixed(2)}`,
        createdAt: now,
      });
    }

    // 🆕 Update freelancer and manager balances for job payments
    if (payment.jobId && updatedJob && distribution) {
      // Update freelancer balance
      if (updatedJob.assignedFreelancerId && distribution.freelancer > 0) {
        const [freelancer] = await db
          .select()
          .from(users)
          .where(eq(users.id, updatedJob.assignedFreelancerId))
          .limit(1);
        
        if (freelancer) {
          const newBalance = (freelancer.balance || 0) + distribution.freelancer;
          await db
            .update(users)
            .set({ 
              balance: newBalance,
              totalEarned: (freelancer.totalEarned || 0) + distribution.freelancer,
              updatedAt: now 
            })
            .where(eq(users.id, updatedJob.assignedFreelancerId));
          
          console.log(`[Payment Approve] Updated freelancer ${updatedJob.assignedFreelancerId} balance: ${newBalance} KSh (+${distribution.freelancer} KSh)`);
        }
      }

      // Update manager balance
      if (updatedJob.managerId && distribution.manager > 0) {
        const [manager] = await db
          .select()
          .from(users)
          .where(eq(users.id, updatedJob.managerId))
          .limit(1);
        
        if (manager) {
          const newBalance = (manager.balance || 0) + distribution.manager;
          await db
            .update(users)
            .set({ 
              balance: newBalance,
              totalEarned: (manager.totalEarned || 0) + distribution.manager,
              updatedAt: now 
            })
            .where(eq(users.id, updatedJob.managerId));
          
          console.log(`[Payment Approve] Updated manager ${updatedJob.managerId} balance: ${newBalance} KSh (+${distribution.manager} KSh)`);
        }
      }
    }

    // Create audit log
    await db.insert(auditLogs).values({
      userId: admin.id,
      userEmail: admin.email,
      userRole: admin.role,
      eventType: 'PAYMENT_APPROVED',
      description: `Admin approved Paystack payment #${paymentId} (${payment.paystackReference}) for KSh ${amountToConfirm.toFixed(2)}`,
      severity: 'MEDIUM',
      resourceType: 'payment',
      resourceId: paymentId,
      oldValues: JSON.stringify({ status: payment.status }),
      newValues: JSON.stringify({ status: 'confirmed', amount: amountToConfirm }),
      metadata: JSON.stringify({
        paymentId,
        paystackReference: payment.paystackReference,
        amount: amountToConfirm,
        jobId: payment.jobId,
        clientId: payment.clientId,
        verificationNotes,
        distribution,
      }),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      createdAt: now,
    });

    // Fetch updated payment
    const [updatedPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: `Payment of KSh ${amountToConfirm.toFixed(2)} approved successfully`,
      data: {
        payment: updatedPayment,
        job: updatedJob,
        distribution,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/v2/payments/[id]/approve] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
