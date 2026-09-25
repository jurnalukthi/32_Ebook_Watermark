import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_APP_URL } from '@/lib/constants';
import { sendMagicLinkEmail } from '@/lib/email';
import { createGrantWithToken, findOrCreateEbook } from '@/lib/grants';
import { extractLynkDetails, verifyLynkSignature } from '@/lib/lynk';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  let webhookLogId: string | null = null;
  const targetUrl = request.nextUrl.toString();

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

    const signatureHeader =
      request.headers.get('x-lynk-signature') ??
      request.headers.get('X-Lynk-Signature');

    const details = extractLynkDetails(payload);

    const { data: logEntry } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        url_target: targetUrl,
        event_name: details.event,
        trx_id: details.refId === 'unknown' ? null : details.refId,
        customer_email: details.customer.email || null,
        payload,
        status: 'received',
      })
      .select('id')
      .single();

    if (logEntry) {
      webhookLogId = logEntry.id;
    }

    const merchantKey = process.env.LYNK_MERCHANT_KEY;

    if (details.event === 'payment.received' && merchantKey && signatureHeader) {
      const isValid = verifyLynkSignature(
        signatureHeader,
        {
          refId: details.refId,
          grandTotal: details.totals.grandTotal,
          messageId: details.messageId,
        },
        merchantKey
      );

      if (!isValid) {
        if (webhookLogId) {
          await supabaseAdmin
            .from('webhook_logs')
            .update({ status: 'failed' })
            .eq('id', webhookLogId);
        }

        return NextResponse.json(
          {
            ok: false,
            message: 'Verifikasi tanda tangan transaksi Lynk gagal.',
          },
          { status: 401 }
        );
      }
    }

    const isPaymentSuccess =
      details.event === 'payment.received' ||
      details.messageAction === 'SUCCESS' ||
      details.messageCode === '0';

    const issuedGrants: Array<{
      ebookId: string;
      grantId: string;
      token: string;
      isNew: boolean;
    }> = [];

    if (isPaymentSuccess && details.customer.email) {
      const targetItems =
        details.items.length > 0
          ? details.items
          : [{ title: 'Ebook Master', uuid: '', qty: 1, price: '0', addons: [] }];

      const baseUrl =
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        DEFAULT_APP_URL;

      for (const item of targetItems) {
        const itemAmount =
          Number(item.price) ||
          (targetItems.length === 1 ? Number(details.totals.grandTotal) : 0) ||
          0;

        const ebookId = await findOrCreateEbook(item.title);
        const grant = await createGrantWithToken({
          email: details.customer.email,
          customerName: details.customer.name,
          ebookId,
          source: 'lynk_webhook',
          trxId: details.refId === 'unknown' ? undefined : details.refId,
          amount: itemAmount,
        });

        issuedGrants.push(grant);

        const downloadUrl = `${baseUrl}/download/${grant.token}`;
        await sendMagicLinkEmail({
          to: details.customer.email,
          recipientName: details.customer.name,
          ebookTitle: item.title,
          downloadUrl,
        });
      }
    }

    if (webhookLogId) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({ status: 'success' })
        .eq('id', webhookLogId);
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook Lynk berhasil diproses.',
        receivedAt: new Date().toISOString(),
        event: details.event,
        refId: details.refId,
        customerEmail: details.customer.email,
        grants: issuedGrants,
      },
      { status: 200 }
    );
  } catch (error) {
    if (webhookLogId) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({ status: 'failed' })
        .eq('id', webhookLogId);
    }

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
      url: `${DEFAULT_APP_URL}/api/webhook/lynk`,
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
