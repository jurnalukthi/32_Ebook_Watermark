import { NextRequest, NextResponse } from 'next/server';

import { isLynkPayload, type LynkWebhookPayload } from '@/lib/lynk';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Permintaan ditolak karena data muatan kosong.',
        },
        { status: 400 }
      );
    }

    let payload: LynkWebhookPayload;

    try {
      payload = JSON.parse(rawBody) as LynkWebhookPayload;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: 'Format data bukan JSON yang valid.',
        },
        { status: 400 }
      );
    }

    if (!isLynkPayload(payload)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Permintaan ditolak karena struktur data tidak sesuai spesifikasi Lynk.',
        },
        { status: 403 }
      );
    }

    const event = payload.event ?? 'unknown';
    const messageId = payload.data?.message_id ?? 'unknown';
    const refId = payload.data?.message_data?.refId ?? 'unknown';
    const customerEmail = payload.data?.message_data?.customer?.email ?? '';

    console.log('[Lynk Webhook Diterima]', {
      timestamp: new Date().toISOString(),
      event,
      messageId,
      refId,
      customerEmail,
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook Lynk berhasil diterima dan diverifikasi.',
        receivedAt: new Date().toISOString(),
        event,
        refId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Lynk Webhook Error]', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Terjadi kendala saat memproses webhook.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'Endpoint penerima webhook Lynk aktif.',
      url: 'https://32-ebook-watermark.vercel.app/api/webhook/lynk',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
