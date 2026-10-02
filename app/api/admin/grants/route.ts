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

export async function DELETE(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : undefined;
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((x: unknown): x is string => typeof x === 'string')
      : undefined;
    const mode = typeof body.mode === 'string' ? body.mode : undefined;

    if (mode === 'clean_test') {
      const { data: testGrants, error: findError } = await supabaseAdmin
        .from('access_grants')
        .select('id')
        .or('amount.eq.0,trx_id.ilike.%test%,trx_id.ilike.%sim%,trx_id.ilike.%gmail%');

      if (findError) {
        throw new Error(`Gagal mencari data test: ${findError.message}`);
      }

      if (!testGrants || testGrants.length === 0) {
        return NextResponse.json({
          ok: true,
          message: 'Tidak ada data uji coba/test yang perlu dibersihkan.',
          deletedCount: 0,
        });
      }

      const targetIds = testGrants.map((g) => g.id);

      await supabaseAdmin.from('magic_tokens').delete().in('grant_id', targetIds);

      const { error: delError } = await supabaseAdmin
        .from('access_grants')
        .delete()
        .in('id', targetIds);

      if (delError) {
        throw new Error(`Gagal menghapus data test: ${delError.message}`);
      }

      return NextResponse.json({
        ok: true,
        message: `Berhasil membersihkan ${targetIds.length} data transaksi test/Rp 0.`,
        deletedCount: targetIds.length,
      });
    }

    if (ids && ids.length > 0) {
      await supabaseAdmin.from('magic_tokens').delete().in('grant_id', ids);

      const { error: delError } = await supabaseAdmin
        .from('access_grants')
        .delete()
        .in('id', ids);

      if (delError) {
        throw new Error(`Gagal menghapus data terpilih: ${delError.message}`);
      }

      return NextResponse.json({
        ok: true,
        message: `Berhasil menghapus ${ids.length} data transaksi.`,
        deletedCount: ids.length,
      });
    }

    if (id) {
      await supabaseAdmin.from('magic_tokens').delete().eq('grant_id', id);

      const { error: delError } = await supabaseAdmin
        .from('access_grants')
        .delete()
        .eq('id', id);

      if (delError) {
        throw new Error(`Gagal menghapus data transaksi: ${delError.message}`);
      }

      return NextResponse.json({
        ok: true,
        message: 'Data transaksi berhasil dihapus.',
        deletedCount: 1,
      });
    }

    return NextResponse.json(
      { ok: false, message: 'Parameter id, ids, atau mode tidak valid.' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
