import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendEmailToAdmins, getNewUserRegistrationAdminHTML } from '@/lib/email';

// Map role names to role_id
const ROLE_MAP: Record<string, number> = {
  'admin': 1,
  'client': 2,
  'freelancer': 3,
  'account_owner': 4,
  'manager': 5
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required', code: 'MISSING_EMAIL' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ error: 'Verification code is required', code: 'MISSING_CODE' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();


    // Find pending registration
    const currentTimestamp = new Date().toISOString();
    const pendingResult = await db.execute(sql`SELECT * FROM pending_registrations WHERE email = ${normalizedEmail} AND verification_code = ${normalizedCode} AND code_expires_at > ${currentTimestamp}`);

    if (pendingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification code', code: 'INVALID_CODE' }, { status: 400 });
    }

    const pending: any = pendingResult.rows[0];

    // Check if user already exists
    const existingUser = await db.execute(sql`SELECT id FROM users WHERE email = ${normalizedEmail}`);

    if (existingUser.rows.length > 0) {
      await db.execute(sql`DELETE FROM pending_registrations WHERE email = ${normalizedEmail}`);
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can now sign in.'
      }, { status: 200 });
    }

    // Get role_id
    const role = String(pending.role);
    const roleId = ROLE_MAP[role] || 2; // Default to client (2)
    const isAdmin = role === 'admin';

    // Determine initial status based on role (admin/account_owner auto-approved)
    const initialStatus = (isAdmin || role === 'account_owner') ? 'approved' : 'pending';
    const approvedAt = (isAdmin || role === 'account_owner') ? new Date().toISOString() : null;

    // Introspect users table to insert only supported columns (avoid schema drift issues)
    const colsRes = await db.execute(sql`SELECT column_name as name FROM information_schema.columns WHERE table_name = 'users'`);
    const columns = colsRes.rows.map((r: any) => String(r.name ?? r.column_name ?? '').toLowerCase());
    const has = (c: string) => columns.includes(c);

    const insertCols: string[] = [];
    const insertVals: any[] = [];

    // Required basics
    insertCols.push('email');
    insertVals.push(normalizedEmail);
    insertCols.push('password');
    insertVals.push(String(pending.password));
    insertCols.push('name');
    insertVals.push(String(pending.name));

    if (has('phone')) { insertCols.push('phone'); insertVals.push(String(pending.phone || '+254700000000')); }
    if (has('role_id')) { insertCols.push('role_id'); insertVals.push(roleId); }
    else if (has('role')) { insertCols.push('role'); insertVals.push(role); }
    if (has('status')) { insertCols.push('status'); insertVals.push(initialStatus); }

    // Optional numeric columns if exist
    if (has('balance_available')) { insertCols.push('balance_available'); insertVals.push(0); }
    if (has('balance_pending')) { insertCols.push('balance_pending'); insertVals.push(0); }
    if (has('total_earned')) { insertCols.push('total_earned'); insertVals.push(0); }
    if (has('rating')) { insertCols.push('rating'); insertVals.push(0); }
    if (has('completed_orders')) { insertCols.push('completed_orders'); insertVals.push(0); }
    if (approvedAt && has('approved_at')) { insertCols.push('approved_at'); insertVals.push(approvedAt); }

    const columnsSql = sql.raw(insertCols.join(', '));
    const valuesSql = sql.join(insertVals.map((v) => sql`${v}`), sql.raw(', '));

    await db.execute(sql`INSERT INTO users (${columnsSql}) VALUES (${valuesSql})`);


    // Delete pending registration
    await db.execute(sql`DELETE FROM pending_registrations WHERE email = ${normalizedEmail}`);

    // Send notification to admins (don't wait for it)
    if (!isAdmin) {
      sendEmailToAdmins({
        subject: `New ${role} Registration - ${pending.name}`,
        html: getNewUserRegistrationAdminHTML(
          String(pending.name),
          normalizedEmail,
          role,
          String(pending.phone || 'Not provided')
        )
      }).catch(err => console.error('Failed to send admin notification:', err));
    }

    return NextResponse.json({ 
      success: true,
      message: initialStatus === 'approved' 
        ? 'Email verified successfully! You can now log in.' 
        : 'Email verified! Your account is pending admin approval. You will be notified once approved.',
    }, { status: 200 });

  } catch (error) {
    console.error('[Verify-Fixed] Verification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

