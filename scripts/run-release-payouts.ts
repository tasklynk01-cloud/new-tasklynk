import 'dotenv/config';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface ReleaseOptions {
  dryRun: boolean;
  minHoursSincePaid: number;
  orderIds?: number[];
  baseUrl: string;
  adminEmail: string;
}

function parseBoolean(value?: string): boolean {
  if (value == null) return true;
  const normalized = value.toLowerCase();
  return normalized !== 'false' && normalized !== '0' && normalized !== 'no';
}

function parseOrderIds(raw?: string): number[] | undefined {
  if (!raw) return undefined;
  const orderIds = raw
    .split(',')
    .map((token) => Number(token.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  return orderIds.length ? orderIds : undefined;
}

function parseCliArgs(): Partial<ReleaseOptions> {
  const overrides: Partial<ReleaseOptions> = {};
  for (const arg of process.argv.slice(2)) {
    const [rawKey, rawValue] = arg.split('=');
    const key = rawKey?.replace(/^--/, '');
    if (!key) continue;
    switch (key) {
      case 'dryRun':
        overrides.dryRun = parseBoolean(rawValue);
        break;
      case 'minHours':
      case 'minHoursSincePaid': {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed) && parsed > 0) {
          overrides.minHoursSincePaid = parsed;
        }
        break;
      }
      case 'orderIds':
        overrides.orderIds = parseOrderIds(rawValue);
        break;
      case 'baseUrl':
        if (rawValue) {
          overrides.baseUrl = rawValue.replace(/\/+$/, '');
        }
        break;
      case 'adminEmail':
        if (rawValue) {
          overrides.adminEmail = rawValue;
        }
        break;
      default:
        console.warn(`[release-payouts] Unrecognized argument "${key}" – skipping`);
    }
  }
  return overrides;
}

async function getAdminToken(adminEmail: string): Promise<string> {
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!admin) {
    throw new Error(`Admin user not found for email: ${adminEmail}`);
  }

  if ((admin.role || '').toLowerCase() !== 'admin') {
    console.warn(`[release-payouts] Warning: user ${adminEmail} is ${admin.role}, forcing token scope to admin`);
  }

  const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'tasklynk-default-secret-change-in-production';
  return jwt.sign(
    {
      userId: admin.id,
      email: admin.email,
      role: admin.role || 'admin',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function main() {
  const envOrderIds = parseOrderIds(process.env.RELEASE_ORDER_IDS);
  const defaults: ReleaseOptions = {
    dryRun: parseBoolean(process.env.RELEASE_DRY_RUN ?? 'true'),
    minHoursSincePaid: Number(process.env.RELEASE_MIN_HOURS ?? 24) || 24,
    orderIds: envOrderIds,
    baseUrl: (process.env.RELEASE_PAYOUTS_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000').replace(/\/+$/, ''),
    adminEmail: process.env.RELEASE_CRON_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'topwriteessays@gmail.com',
  };

  const options: ReleaseOptions = {
    ...defaults,
    ...parseCliArgs(),
  };

  console.log('[release-payouts] Using options:', {
    dryRun: options.dryRun,
    minHoursSincePaid: options.minHoursSincePaid,
    orderIds: options.orderIds,
    baseUrl: options.baseUrl,
    adminEmail: options.adminEmail,
  });

  const token = await getAdminToken(options.adminEmail);

  const response = await fetch(`${options.baseUrl}/api/v2/orders/release-payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dryRun: options.dryRun,
      minHoursSincePaid: options.minHoursSincePaid,
      orderIds: options.orderIds,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[release-payouts] Request failed:', response.status, data);
    process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    console.log(`Dry run complete – ${data.orders?.length || 0} orders ready for release.`);
    (data.orders || []).forEach((order: any) => {
      console.log(` • ${order.label || `#${order.id}`} (paid at ${order.paidAt || 'unknown'})`);
    });
  } else {
    console.log(`Released payouts for ${data.released || 0} orders.`);
    (data.details || []).forEach((detail: any) => {
      console.log(
        ` • Order #${detail.orderId} | writer KSh ${detail.freelancerReleased} | manager KSh ${detail.managerReleased}`
      );
    });
  }
}

main().catch((error) => {
  console.error('[release-payouts] Unexpected failure:', error);
  process.exitCode = 1;
});
