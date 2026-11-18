import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications, invoices, jobStatusLogs, jobAttachments, paymentTransactions, writerBalances } from '@/db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { calculateWriterEarningsByCPPLevel, managerAssignFee, managerSubmitFee } from '@/lib/payment-calculations';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    const { id } = await params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid payment ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const paymentId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { confirmed, adminVerificationCode } = body;

    // Validate confirmed field
    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Confirmed field is required and must be a boolean',
          code: 'INVALID_CONFIRMED_FIELD' 
        },
        { status: 400 }
      );
    }

    // If confirming, require admin verification code
    if (confirmed && (!adminVerificationCode || typeof adminVerificationCode !== 'string' || adminVerificationCode.trim() === '')) {
      return NextResponse.json(
        { 
          error: 'Admin verification code is required to confirm payment',
          code: 'MISSING_ADMIN_CODE' 
        },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { 
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const payment = existingPayment[0];
    const currentTimestamp = new Date().toISOString();
    const jobId = payment.jobId;

    if (confirmed) {
      // VERIFY MPESA CODES MATCH
      const clientCode = (payment.mpesaCode || '').trim().toUpperCase();
      const adminCode = (adminVerificationCode || '').trim().toUpperCase();

      if (clientCode !== adminCode) {
        return NextResponse.json(
          { 
            error: 'M-PESA codes do not match. Payment verification failed.',
            code: 'CODE_MISMATCH',
            clientCode: clientCode,
            adminCode: adminCode
          },
          { status: 400 }
        );
      }

      // CODES MATCH → ADMIN CONFIRMED PAYMENT → Move order to COMPLETED and create UNPAID invoice
      
      // Update payment to confirmed with admin verification code
      const updatedPayment = await db.update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: true,
          adminVerificationCode: adminCode,
          confirmedAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Handle wallet top-up payments (no job associated)
      if (!jobId) {
        // For wallet top-ups, just confirm payment without job processing
        return NextResponse.json({
          payment: updatedPayment[0],
          breakdown: { writerAmount: 0, managerTotal: 0, adminCommission: payment.amount },
          message: 'Wallet top-up payment confirmed successfully.'
        }, { status: 200 });
      }

      // Get job details
      const job = await db.select()
        .from(jobs)
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (job.length === 0) {
        return NextResponse.json(
          { 
            error: 'Associated job not found',
            code: 'JOB_NOT_FOUND' 
          },
          { status: 404 }
        );
      }

      const jobData = job[0] as any;

      // Guard against double-crediting: this legacy confirm flow and the v2
      // order-lifecycle flow (processOrderApproval/confirmPaymentReceived/
      // settlePaidOrder in order-flow-helpers.ts) both credit freelancer/manager
      // balances for the same order through different tables. If the order has
      // already been paid/completed by either flow, reject instead of crediting
      // again.
      if (jobData.paymentConfirmed || jobData.status === 'completed' || jobData.status === 'paid') {
        return NextResponse.json(
          {
            error: `Order ${jobData.displayId || jobData.id} has already had its payment confirmed (status: ${jobData.status}). Refusing to re-credit balances.`,
            code: 'ALREADY_CONFIRMED',
          },
          { status: 409 }
        );
      }

      let managerIdToCredit: number | null = jobData.managerId ?? null;

      // Fetch freelancer to get completedJobs count for CPP tier calculation
      let freelancerCompletedJobs = 0;
      if (jobData.assignedFreelancerId) {
        const [freelancer] = await db.select()
          .from(users)
          .where(eq(users.id, jobData.assignedFreelancerId))
          .limit(1);
        if (freelancer) {
          // ✅ Use completedJobs + 1 because this order will increment the count
          // This ensures CPP calculation uses the tier AFTER this order completes
          freelancerCompletedJobs = (freelancer.completedJobs || 0) + 1;
          if (!managerIdToCredit) {
            managerIdToCredit = freelancer.assignedManagerId ?? null;
          }
        }
      }

      if (!managerIdToCredit) {
        const [clientRow] = await db.select()
          .from(users)
          .where(eq(users.id, jobData.clientId as number))
          .limit(1);
        managerIdToCredit = clientRow?.assignedManagerId ?? null;
      }

      // Calculate amounts for invoice - CPP LEVEL SYSTEM (tier-based, post-completion)
      // 🔴 CRITICAL: singleSpaced orders double the page count for ALL calculations
      const isSingleSpaced = Boolean(jobData.singleSpaced);
      
      const writerAmount = calculateWriterEarningsByCPPLevel(
        jobData.pages, 
        jobData.slides, 
        jobData.workType, 
        freelancerCompletedJobs,
        isSingleSpaced  // 🔴 Include single-spaced flag
      );
      const assignFee = jobData.assignedFreelancerId ? managerAssignFee() : 0;
      const submitFee = managerSubmitFee(jobData.pages, isSingleSpaced); // 🔴 Pass singleSpaced
      const managerTotal = assignFee + submitFee;
      const adminCommission = Math.max(0, Number(payment.amount) - (writerAmount + managerTotal));

      // 📝 AUDIT: Log payment confirmation
      await logAdminActionWithRequest(
        request,
        adminUser.id,
        AdminActions.CONFIRM_PAYMENT,
        paymentId,
        AuditTargetTypes.PAYMENT,
        {
          jobId: payment.jobId,
          clientId: payment.clientId,
          amount: payment.amount,
          writerAmount,
          managerTotal,
          adminCommission,
          paymentMethod: payment.paymentMethod,
          mpesaCode: payment.mpesaCode,
        }
      );

      // ✅ WRAP IN TRANSACTION: Payment confirmation + balance credits + invoice creation
      await db.transaction(async (tx) => {
        // Persist rollups on job and set to completed
        try {
          await tx.update(jobs)
            .set({
              status: 'completed',
              paymentConfirmed: true,
              updatedAt: currentTimestamp,
              managerId: jobData.managerId || managerIdToCredit || null,
              // @ts-ignore drizzle runtime may ignore unknown cols if missing
              freelancerEarnings: writerAmount,
              // @ts-ignore
              managerEarnings: managerTotal,
              // @ts-ignore
              adminProfit: adminCommission,
              // @ts-ignore
              paidOrderConfirmedAt: currentTimestamp
            } as any)
            .where(eq(jobs.id, jobId));
        } catch {
          // Columns might not exist on older schemas; ignore silently
        }

        // CREDIT BALANCES: writer and manager
        try {
          // Credit freelancer
          if (jobData.assignedFreelancerId) {
            await tx.update(users)
              .set({
                balance: sql`${users.balance} + ${writerAmount}`,
                totalEarned: sql`${users.totalEarned} + ${writerAmount}`,
                completedJobs: sql`${users.completedJobs} + 1`,
              })
              .where(eq(users.id, jobData.assignedFreelancerId as number));

            // ✅ ISSUE #7 FIX: Sync writerBalances table for consistency
            const [existingWriterBalance] = await tx.select()
              .from(writerBalances)
              .where(eq(writerBalances.writerId, jobData.assignedFreelancerId as number));

            if (existingWriterBalance) {
              await tx.update(writerBalances)
                .set({
                  availableBalance: existingWriterBalance.availableBalance + writerAmount,
                  totalEarned: existingWriterBalance.totalEarned + writerAmount,
                  updatedAt: currentTimestamp,
                })
                .where(eq(writerBalances.writerId, jobData.assignedFreelancerId as number));
            } else {
              // Create writer balance record if doesn't exist
              await tx.insert(writerBalances).values({
                writerId: jobData.assignedFreelancerId as number,
                availableBalance: writerAmount,
                pendingBalance: 0,
                totalEarned: writerAmount,
                updatedAt: currentTimestamp,
              });
            }
          }

          if (managerIdToCredit && managerTotal > 0) {
            await tx.update(users)
              .set({
                balance: sql`${users.balance} + ${managerTotal}`,
                totalEarned: sql`${users.totalEarned} + ${managerTotal}`,
              })
              .where(eq(users.id, managerIdToCredit));
            // Notify manager on payout
            await tx.insert(notifications).values({
              userId: managerIdToCredit,
              jobId: jobId,
              type: 'manager_payout',
              title: 'Manager Earnings Credited',
              message: `You earned KSh ${managerTotal} for order ${jobData.displayId || `#${jobData.id}`}.`,
              read: false,
              createdAt: currentTimestamp
            });
          }
        } catch (balErr) {
          console.error('Balance credit error:', balErr);
          throw balErr; // Rollback transaction on balance error
        }

        // ✅ CREATE PAID INVOICE (INSIDE TRANSACTION)
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayInvoices = await tx.select().from(invoices)
          .where(gte(invoices.createdAt, startOfDay));
        const sequenceNum = (todayInvoices.length + 1).toString().padStart(5, '0');
        const invoiceNumber = `INV-${dateStr}-${sequenceNum}`;

        await tx.insert(invoices).values({
          jobId: jobId,
          clientId: payment.clientId,
          freelancerId: jobData.assignedFreelancerId || null,
          invoiceNumber,
          amount: payment.amount,
          freelancerAmount: writerAmount,
          adminCommission: adminCommission,
          managerAmount: managerTotal,
          companyFee: 0, // ✅ FIXED: Explicitly set companyFee
          managerAdditionalIncluded: 0, // ✅ FIXED: Explicitly set manager additional
          clientBonusIncluded: 0, // ✅ FIXED: Explicitly set client bonus
          description: `Payment for order ${jobData.displayId || jobData.id} - ${jobData.title}`,
          status: 'paid', // ✅ FIXED: Mark as paid since payment confirmed
          isPaid: true,    // ✅ FIXED: Set isPaid to true
          paidAt: currentTimestamp, // ✅ FIXED: Set paidAt timestamp
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        });
      });

      // Record financials snapshot for this order
      try {
        await db.execute(sql`INSERT INTO order_financials (job_id, client_amount, writer_amount, manager_amount, platform_fee)
                         VALUES (${jobId}, ${Number(payment.amount)}, ${writerAmount}, ${managerTotal}, ${adminCommission})`);
      } catch (e) {
        // Table might not exist until setup endpoint is run; ignore silently
        console.error('order_financials insert error (non-fatal):', e);
      }

      // AUDIT LOG: mark order completed
      try {
        await db.insert(jobStatusLogs).values({
          jobId: jobId,
          oldStatus: jobData.status,
          newStatus: 'completed',
          changedBy: payment.clientId, // actor context best-effort
          note: 'Payment confirmed by admin; order completed',
          createdAt: currentTimestamp
        });
      } catch (logErr) {
        console.error('Failed to write job status log:', logErr);
      }

      // SCHEDULE FILE DELETION after 7 days
      try {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        await db.update(jobAttachments)
          .set({ scheduledDeletionAt: oneWeekFromNow.toISOString() })
          .where(eq(jobAttachments.jobId, jobId));
      } catch (schedErr) {
        console.error('Failed to schedule file deletion:', schedErr);
      }

      // Notify freelancer (credited)
      if (jobData.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: jobData.assignedFreelancerId,
          jobId: jobId,
          type: 'order_completed',
          title: 'Order Completed - Earnings Credited',
          message: `Order ${jobData.displayId || `#${jobData.id}`} is completed. You were credited KSh ${writerAmount}.`,
          read: false,
          createdAt: currentTimestamp
        });
      }

      // Notify client
      const client = await db.select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client.length > 0) {
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: jobId,
          type: 'payment_confirmed',
          title: 'Payment Confirmed - Order Completed',
          message: `Your payment for order ${jobData.displayId || `#${jobData.id}`} is confirmed. The order is now completed.`,
          read: false,
          createdAt: currentTimestamp
        });

        // Optional email update to client
        try {
          await sendEmail({
            to: client[0].email,
            subject: `[Order ${jobData.displayId || `#${jobData.id}`}] Payment Confirmed` ,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1D3557;">Payment Confirmed</h2>
                <p>Hello ${client[0].name},</p>
                <p>Your payment of <strong>KES ${payment.amount.toFixed(2)}</strong> has been confirmed.</p>
                <p>Your order <strong>#${jobData.displayId || jobData.id} - ${jobData.title}</strong> is now <strong>COMPLETED</strong>.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/client/orders/${jobData.id}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }
      }

      return NextResponse.json({
        payment: updatedPayment[0],
        breakdown: { writerAmount, managerTotal, adminCommission },
        message: 'Payment confirmed. Order completed. Invoice created and pending confirmation.'
      }, { status: 200 });

    } else {
      // PAYMENT REJECTED/FAILED
      
      // Update payment to failed
      const updatedPayment = await db.update(payments)
        .set({
          status: 'failed',
          confirmedByAdmin: false,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Get client details
      const client = await db.select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client.length > 0) {
        // Create notification for client
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_failed',
          title: 'Payment Verification Failed',
          message: 'Payment verification failed. Please try again with the correct M-Pesa code or use M-Pesa Direct Pay.',
          read: false,
          createdAt: currentTimestamp
        });

        // Send email to client
        try {
          await sendEmail({
            to: client[0].email,
            subject: `[Order #${payment.jobId}] Payment Verification Failed`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1D3557;">Payment Verification Failed</h2>
                <p>Hello ${client[0].name},</p>
                <p>Unfortunately, we could not verify your payment of <strong>KES ${payment.amount.toFixed(2)}</strong>.</p>
                <p>Please try again:</p>
                <ul>
                  <li>Double-check your M-Pesa code and resubmit</li>
                  <li>Or use M-Pesa Direct Pay for instant verification</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/client/orders/${payment.jobId}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Retry Payment</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }
      }

      return NextResponse.json({
        payment: updatedPayment[0],
        message: 'Payment marked as failed'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}