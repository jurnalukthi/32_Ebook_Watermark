import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_EMAIL, DEFAULT_APP_URL } from '@/lib/constants';
import { sendMagicLinkEmail } from '@/lib/email';
import { createGrantWithToken } from '@/lib/grants';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { ok: false, message: 'Akses ditolak. Sesi tidak sah.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : undefined;
    const ebookId = typeof body.ebookId === 'string' ? body.ebookId.trim() : '';
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount) || 0;

    if (!email || !ebookId) {
      return NextResponse.json(
        { ok: false, message: 'Email pembeli dan pilihan e-book wajib diisi.' },
        { status: 400 }
      );
    }

    const { data: targetEbook, error: ebookError } = await supabaseAdmin
      .from('ebooks')
      .select('id, title')
      .eq('id', ebookId)
      .single();

    if (ebookError || !targetEbook) {
      return NextResponse.json(
        { ok: false, message: 'E-book yang dipilih tidak ditemukan.' },
        { status: 404 }
      );
    }

    const grant = await createGrantWithToken({
      email,
      customerName,
      ebookId,
      source: 'manual_admin',
      amount,
    });

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      DEFAULT_APP_URL;

    const downloadUrl = `${baseUrl}/download/${grant.token}`;

    await sendMagicLinkEmail({
      to: email,
      recipientName: customerName,
      ebookTitle: targetEbook.title,
      downloadUrl,
    });

    return NextResponse.json({
      ok: true,
      message: 'Hak akses berhasil diberikan dan tautan unduhan telah dikirim via email.',
      grant,
      downloadUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
