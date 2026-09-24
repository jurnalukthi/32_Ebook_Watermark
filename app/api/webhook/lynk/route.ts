import { NextRequest, NextResponse } from 'next/server';

import { addWebhookHistoryRecord, getConfiguredWebhookUrl } from '@/lib/webhook-store';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    let payload: any = null;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid JSON payload',
        },
        { status: 400 }
      );
    }

    const eventName = payload?.event ?? 'unknown';
    const messageId = payload?.data?.message_id ?? payload?.message_id ?? 'unknown';
    const refId = payload?.data?.message_data?.refId ?? payload?.refId ?? 'unknown';
    const customerEmail = payload?.data?.message_data?.customer?.email ?? payload?.customer?.email ?? '';

    const record = addWebhookHistoryRecord({
      urlTarget: getConfiguredWebhookUrl(),
      eventName,
      trxId: refId,
      status: 'success',
      customerEmail,
      payload,
    });

    console.log('--- Lynk Webhook Received ---');
    console.log('Event:', eventName);
    console.log('Ref ID:', refId);
    console.log('Message ID:', messageId);
    console.log('Customer Email:', customerEmail);
    console.log('History ID:', record.id);

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString(),
        event: eventName,
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
    url: getConfiguredWebhookUrl(),
    mode: 'simple-url-receive',
  });
}
