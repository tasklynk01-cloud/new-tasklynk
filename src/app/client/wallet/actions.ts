"use server"
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://tasklynk.co.ke'
  );
};

const buildAuthHeaders = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;
  return {
    ...(token ? { Cookie: `auth_session=${token}` } : {}),
  };
};

export async function initiateTopUp({ amount, phoneNumber }: { amount: number; phoneNumber: string }) {
  const baseUrl = getBaseUrl();
  const authHeaders = await buildAuthHeaders();
  const res = await fetch(`${baseUrl}/api/payments/mpesa/stk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ type: 'topup', amount, phoneNumber }),
    cache: 'no-store', // Financial transactions must always be fresh
  })
  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Failed to initiate payment' }
  }
  revalidatePath('/client/wallet/add-funds')
  return { ok: true, data }
}

export async function initiateTillPayment({ amount, mpesaCode, phoneNumber }: { amount: number; mpesaCode: string; phoneNumber?: string }) {
  const baseUrl = getBaseUrl();
  const authHeaders = await buildAuthHeaders();
  const res = await fetch(`${baseUrl}/api/v2/payments/till/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ jobId: 0, amount, mpesaCode, phoneNumber }),
    cache: 'no-store', // Financial transactions must always be fresh
  })
  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Failed to submit payment' }
  }
  revalidatePath('/client/wallet/add-funds')
  return { ok: true, data }
}

export async function getClientPaymentTerms(): Promise<'poa' | 'pod'> {
  const baseUrl = getBaseUrl();
  const authHeaders = await buildAuthHeaders();
  try {
    const res = await fetch(`${baseUrl}/api/v2/auth/session`, {
      headers: {
        ...authHeaders,
      },
      next: { revalidate: 60 }, // User profile data can be cached briefly
    })
    if (!res.ok) return 'pod'
    const data = await res.json()
    return data?.user?.paymentTerms === 'poa' ? 'poa' : 'pod'
  } catch {
    return 'pod'
  }
}

