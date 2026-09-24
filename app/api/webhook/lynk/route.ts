import { NextRequest, NextResponse } from 'next/server';

import { verifyLynkSignature } from '@/lib/lynk';

const WEBHOOK_SIGNATURE_HEADER = 'x-lynk-signature';
const DEFAULT_WEBHOOK_SECRET = 'dev-local-secret';

const LYNK_WEBHOOK_SECRET = process.env.LYNK_WEBHOOK_SECRET ?? DEFAULT_WEBHOOK_SECRET;

type WebhookPayload = {
  event?: string;
  txid?: string;
  customer_email?: string;
};

function parseWebhookPayload(rawBody: string): WebhookPayload | null {
  try {
    const payload = JSON.parse(rawBody) as unknown;

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    return payload as WebhookPayload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get(WEBHOOK_SIGNATURE_HEADER);

    if (!verifyLynkSignature(rawBody, signature, LYNK_WEBHOOK_SECRET)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid Lynk signature',
        },
        { status: 401 }
      );
    }

    const payload = parseWebhookPayload(rawBody);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid JSON payload',
        },
        { status: 400 }
      );
    }

    const { event, txid, customer_email: customerEmail } = payload;

    console.log('--- Lynk Webhook Received ---');
    console.log('Signature:', signature);
    console.log('Event:', event);
    console.log('Txid:', txid);
    console.log('Customer Email:', customerEmail);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString(),
        event,
        txid,
        customer_email: customerEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook parse error:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Unhandled webhook error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Lynk webhook endpoint is ready.',
    envConfigured: Boolean(process.env.LYNK_WEBHOOK_SECRET),
  });
}
