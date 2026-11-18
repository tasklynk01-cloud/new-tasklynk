/**
 * Restore user contacts from USERS_BY_ROLE.md and send password reset emails.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = (process.env.DATABASE_URL || '').trim().split('?')[0];
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'TaskLynk <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
const resend = new Resend(RESEND_API_KEY);

const ROLE_MAP = { admin: 1, client: 2, manager: 3, freelancer: 4, editor: 5, account_owner: 6 };
const ROLE_NAMES = { 1: 'admin', 2: 'client', 3: 'manager', 4: 'freelancer', 5: 'editor', 6: 'account_owner' };
const DISPLAY_PREFIX = { 1: 'ADM', 2: 'CLT', 3: 'MGR', 4: 'FRL', 5: 'ED', 6: 'AO' };

function parseUsersFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const users = [];
  const lines = content.split('\n');
  let currentRole = '';
  let inTable = false;

  for (const line of lines) {
    const roleMatch = line.match(/^##\s+(\w+)\s*\((\d+)\)/);
    if (roleMatch) {
      currentRole = roleMatch[1].toLowerCase();
      inTable = false;
      continue;
    }
    if (line.includes('| Email | Name | Status |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.match(/^\|[\s-]+\|/)) continue;
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length >= 5) {
        const email = cells[0];
        const name = cells[1];
        const test = cells[4] === 'Test';
        if (email && name && email.includes('@')) {
          users.push({ email: email.toLowerCase(), name, role: currentRole, test });
        }
      }
    }
  }
  return users;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(16).toString('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
}

async function seedRoles() {
  const existingRoles = await pool.query('SELECT id, name FROM public.roles ORDER BY id');
  if (existingRoles.rows.length > 0) {
    console.log(`✅ Roles already seeded (${existingRoles.rows.length} roles)`);
    return;
  }
  console.log('🔧 Seeding roles...');
  const roles = [
    { id: 1, name: 'admin', description: 'System administrator with full access' },
    { id: 2, name: 'client', description: 'Client who posts orders' },
    { id: 3, name: 'manager', description: 'Manager who handles clients and assigns orders' },
    { id: 4, name: 'freelancer', description: 'Freelance writer who completes orders' },
    { id: 5, name: 'editor', description: 'Editor who reviews and edits work' },
    { id: 6, name: 'account_owner', description: 'Account owner with billing access' },
  ];
  for (const role of roles) {
    await pool.query('INSERT INTO public.roles (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [role.id, role.name, role.description]);
  }
  console.log(`✅ Seeded ${roles.length} roles`);
}

async function getNextDisplayId(roleId) {
  const prefix = DISPLAY_PREFIX[roleId] || 'USR';
  const rows = await pool.query(`SELECT display_id FROM public.users WHERE display_id LIKE $1 ORDER BY display_id DESC LIMIT 1`, [`${prefix}%`]);
  if (rows.rows.length === 0) {
    if (roleId === 1) return `${prefix}#00000001`;
    if (roleId === 2) return `${prefix}#9000001`;
    if (roleId === 3) return `${prefix}#90001`;
    if (roleId === 4) return `${prefix}#90000001`;
    if (roleId === 5) return `${prefix}#90001`;
    return `${prefix}#1`;
  }
  const current = rows.rows[0].display_id;
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return `${prefix}#1`;
  const num = parseInt(match[2], 10) + 1;
  const padded = String(num).padStart(match[2].length, '0');
  return `${match[1]}${padded}`;
}

async function createOrUpdateUser(userData) {
  const roleId = ROLE_MAP[userData.role.toLowerCase()] || 2;
  const roleName = ROLE_NAMES[roleId] || 'client';
  const status = userData.role.toLowerCase() === 'freelancer' ? 'approved' : 'active';
  const approved = true;
  const phone = '+254700000000';
  const badgeList = '[]';
  const presenceStatus = 'offline';
  const clientPriority = 'regular';
  const paymentTerms = 'pod';
  const skillsCompleted = false;
  const twoFactorEnabled = false;
  const authProvider = 'local';

  const existing = await pool.query('SELECT id, display_id, phone FROM public.users WHERE email = $1', [userData.email]);

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    const displayId = existing.rows[0].display_id || await getNextDisplayId(roleId);
    const finalPhone = existing.rows[0].phone || phone;
    await pool.query(
      `UPDATE public.users 
       SET name=$1, role=$2, role_id=$3, status=$4, approved=$5, display_id=$6, phone=$7, badge_list=$8, presence_status=$9, client_priority=$10, payment_terms=$11, skills_completed=$12, two_factor_enabled=$13, auth_provider=$14, updated_at=NOW()
       WHERE id=$15`,
      [userData.name, roleName, roleId, status, approved, displayId, finalPhone, badgeList, presenceStatus, clientPriority, paymentTerms, skillsCompleted, twoFactorEnabled, authProvider, userId]
    );
    return { id: userId, existing: true };
  }

  const tempPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(tempPassword);
  const displayId = await getNextDisplayId(roleId);
  const uniquePhone = `+000${crypto.randomBytes(6).toString('hex')}`;

  const result = await pool.query(
    `INSERT INTO public.users 
     (email, password, name, role, role_id, status, approved, display_id, phone, badge_list, presence_status, client_priority, payment_terms, skills_completed, two_factor_enabled, auth_provider, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
     RETURNING id`,
    [userData.email, hashedPassword, userData.name, roleName, roleId, status, approved, displayId, uniquePhone, badgeList, presenceStatus, clientPriority, paymentTerms, skillsCompleted, twoFactorEnabled, authProvider, true]
  );

  return { id: result.rows[0].id, existing: false };
}

async function createResetToken(userId) {
  const { token, hashedToken } = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await pool.query(
    'INSERT INTO public.password_reset_tokens (user_id, token, expires_at, used, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [userId, hashedToken, expiresAt, false]
  );
  return { token, resetUrl: `${APP_URL}/reset-password?token=${token}` };
}

async function sendPasswordResetEmail(email, userName, resetUrl) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Reset Your TaskLynk Password - System Update',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - TaskLynk</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); padding: 40px 30px; text-align: center;">
                        <div style="margin-bottom: 15px;">
                          <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Revised-logo-1761824652421.png?width=800&height=800&resize=contain" alt="TaskLynk Logo" style="height: 50px; width: auto;" onerror="this.style.display='none'">
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">TaskLynk Academic</h1>
                        <p style="margin: 10px 0 0; color: #F2A541; font-size: 16px;">Professional Academic Writing Platform</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="display: inline-block; width: 80px; height: 80px; background-color: #F2A541; border-radius: 50%; text-align: center; line-height: 80px;">
                            <span style="font-size: 40px;">🔐</span>
                          </div>
                        </div>
                        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Password Reset Request</h2>
                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your TaskLynk account. Click the button below to create a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                        </div>
                        <div style="background-color: #fef3c7; border-left: 4px solid #F2A541; padding: 20px; margin: 20px 0;">
                          <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;"><strong>⚠️ Important:</strong> This link will expire in 1 hour and can only be used once. If you didn't request this password reset, please ignore this email.</p>
                        </div>
                        <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #1D3557; word-break: break-all;">${resetUrl}</a></p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">© 2025 TaskLynk Academic. All rights reserved.</p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Nairobi, Kenya | admn@tasklynk.co.ke | +254701066845</p>
                        <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;"><a href="https://tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">Visit Website</a></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      return false;
    }
    console.log(`✅ Email sent to ${email}:`, data?.id);
    return true;
  } catch (error) {
    console.error(`❌ Email error for ${email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('TaskLynk User Contact Restoration');
  console.log('========================================\n');

  const usersFilePath = path.resolve(__dirname, '..', 'docs', 'USERS_BY_ROLE.md');
  if (!fs.existsSync(usersFilePath)) {
    console.error(`❌ Users file not found: ${usersFilePath}`);
    process.exit(1);
  }

  const users = parseUsersFromMarkdown(usersFilePath);
  console.log(`📋 Found ${users.length} users in USERS_BY_ROLE.md\n`);

  await seedRoles();

  let created = 0;
  let updated = 0;
  let emailsSent = 0;
  let emailsFailed = 0;

  for (const user of users) {
    try {
      const { id, existing } = await createOrUpdateUser(user);
      if (existing) {
        updated++;
        console.log(`🔄 Updated: ${user.email} (${user.role})`);
      } else {
        created++;
        console.log(`✅ Created: ${user.email} (${user.role})`);
      }

      const { resetUrl } = await createResetToken(id);
      const emailSent = await sendPasswordResetEmail(user.email, user.name, resetUrl);
      if (emailSent) emailsSent++; else emailsFailed++;

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error.message);
      emailsFailed++;
    }
  }

  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Total users processed: ${users.length}`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Emails sent: ${emailsSent}`);
  console.log(`  Emails failed: ${emailsFailed}`);
  console.log('========================================');

  if (emailsFailed > 0) {
    console.log('\n⚠️  Note: If Resend reports testing-mode restrictions, verify your domain at resend.com/domains and update FROM_EMAIL to a verified tasklynk.co.ke address to send to all users.');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
