import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { sendEmail, getAccountOwnerWelcomeHTML, getAccountRegistrationReceivedHTML } from '@/lib/email';

/**
 * Test endpoint to send registration welcome emails to the last 5 registered clients
 * GET /api/test/send-registration-emails
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Test] Starting to find and send emails to last 5 registered clients...');

    // Find the last 5 registered clients (role = 'client' or 'account_owner')
    // Order by created_at descending to get the most recent ones
    const lastClients = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          eq(users.role, 'client'),
          eq(users.role, 'account_owner')
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(5);

    if (lastClients.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No clients found in the database',
        sent: 0,
        total: 0,
      }, { status: 404 });
    }

    console.log(`[Test] Found ${lastClients.length} clients to send emails to`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send email to each client
    for (const client of lastClients) {
      try {
        console.log(`[Test] Sending email to ${client.email} (${client.role})...`);

        const isAccountOwnerRole = client.role === 'account_owner';
        const subject = isAccountOwnerRole
          ? '🎉 Welcome to TaskLynk Academic Writing Platform - Your Professional Writing Team Awaits'
          : '✅ Welcome to TaskLynk Academic - Your Account is Active!';
        const html = isAccountOwnerRole
          ? getAccountOwnerWelcomeHTML(client.name)
          : getAccountRegistrationReceivedHTML(client.name);

        const emailResult = await sendEmail({
          to: client.email,
          subject,
          html,
          category: 'registration',
        });

        if (emailResult.success) {
          successCount++;
          results.push({
            email: client.email,
            name: client.name,
            role: client.role,
            status: 'sent',
            messageId: emailResult.messageId,
          });
          console.log(`✅ [Test] Email sent successfully to ${client.email}`);
        } else {
          failureCount++;
          results.push({
            email: client.email,
            name: client.name,
            role: client.role,
            status: 'failed',
            error: emailResult.error,
          });
          console.error(`❌ [Test] Failed to send email to ${client.email}:`, emailResult.error);
        }
      } catch (error: any) {
        failureCount++;
        results.push({
          email: client.email,
          name: client.name,
          role: client.role,
          status: 'error',
          error: error?.message || 'Unknown error',
        });
        console.error(`❌ [Test] Error sending email to ${client.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} emails successfully, ${failureCount} failed`,
      total: lastClients.length,
      sent: successCount,
      failed: failureCount,
      results,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Test] Error in send-registration-emails:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}


