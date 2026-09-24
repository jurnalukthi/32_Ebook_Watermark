import { NextRequest, NextResponse } from 'next/server';

import { extractLynkDetails } from '@/lib/lynk';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};

    if (rawBody && rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        payload = { rawText: rawBody };
      }
    }

    const headersRecord: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersRecord[key] = val;
    });

    const details = extractLynkDetails(payload);

    console.log('[Lynk Webhook Diterima]', {
      timestamp: new Date().toISOString(),
      event: details.event,
      refId: details.refId,
      customerEmail: details.customerEmail,
      messageId: details.messageId,
      headers: headersRecord,
      payload,
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook Lynk berhasil diterima.',
        receivedAt: new Date().toISOString(),
        event: details.event,
        refId: details.refId,
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

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, POST, HEAD, OPTIONS',
    },
  });
}
