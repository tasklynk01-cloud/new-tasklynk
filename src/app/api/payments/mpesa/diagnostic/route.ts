import { NextResponse } from 'next/server';
import { getDarajaConfig, getDarajaAccessToken } from '@/lib/mpesa-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getDarajaConfig();

  const maskString = (str?: string) => {
    if (!str) return '(not set)';
    if (str.length <= 8) return '****';
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  };

  const configuredStatus = {
    env: config.env,
    consumerKeyConfigured: Boolean(config.consumerKey),
    consumerKeyMasked: maskString(config.consumerKey),
    consumerSecretConfigured: Boolean(config.consumerSecret),
    consumerSecretMasked: maskString(config.consumerSecret),
    passkeyConfigured: Boolean(config.passkey),
    passkeyMasked: maskString(config.passkey),
    shortcodeConfigured: Boolean(config.shortcode),
    shortcode: config.shortcode,
    transactionType: config.transactionType,
    stkCallbackUrl: config.stkCallbackUrl,
  };

  if (!config.consumerKey || !config.consumerSecret) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in .env',
      configuration: configuredStatus,
    }, { status: 400 });
  }

  try {
    // Attempt live OAuth token generation with forceRefresh = true
    const token = await getDarajaAccessToken(true);
    return NextResponse.json({
      success: true,
      connected: true,
      message: `Successfully connected to Safaricom Daraja (${config.env}) and acquired OAuth access token!`,
      configuration: configuredStatus,
      tokenMasked: maskString(token),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: err.message,
      troubleshooting: {
        cause: 'Daraja rejected the credentials with HTTP 400.',
        steps: [
          `1. Verify if your Daraja App credentials belong to '${config.env}' or the other environment.`,
          `2. Check that MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your .env match your Daraja Portal application under "My Apps".`,
          `3. If you are using Production credentials, ensure MPESA_ENV=production is set. If Sandbox, ensure MPESA_ENV=sandbox is set.`,
          `4. Ensure your Daraja application has Lipa na M-Pesa / M-Pesa Express product enabled.`,
        ],
      },
      configuration: configuredStatus,
    }, { status: 400 });
  }
}
