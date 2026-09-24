import { NextRequest, NextResponse } from 'next/server';

import { verifyLynkSignature } from '@/lib/lynk';

const WEBHOOK_SIGNATURE_HEADER = 'x-lynk-signature';
const DEFAULT_WEBHOOK_SECRET = 'dev-local-secret';

const MERCHANT_KEY =
  process.env.LYNK_MERCHANT_KEY ?? process.env.LYNK_WEBHOOK_SECRET ?? DEFAULT_WEBHOOK_SECRET;

type WebhookPayload = {
  event?: string;
  data?: {
    message_id?: string;
    message_data?: {
      refId?: string;
      customer?: {
        email?: string;
      };
      totals?: {
        grandTotal?: number | string;
      };
    };
  };
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

    if (!verifyLynkSignature(payload, signature, MERCHANT_KEY)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid Lynk signature',
        },
        { status: 401 }
      );
    }

    const event = payload.event;
    const messageId = payload.data?.message_id;
    const refId = payload.data?.message_data?.refId;
    const customerEmail = payload.data?.message_data?.customer?.email;

    console.log('--- Lynk Webhook Received ---');
    console.log('Signature:', signature);
    console.log('Event:', event);
    console.log('Ref ID:', refId);
    console.log('Message ID:', messageId);
    console.log('Customer Email:', customerEmail);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString(),
        event,
        message_id: messageId,
        refId,
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
    envConfigured: Boolean(process.env.LYNK_MERCHANT_KEY || process.env.LYNK_WEBHOOK_SECRET),
  });
}
