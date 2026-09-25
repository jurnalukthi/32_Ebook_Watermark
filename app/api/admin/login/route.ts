import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAIL = 'jurnalukthi@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json(
        { ok: false, message: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { ok: false, message: 'Akses ditolak. Email bukan administrator.' },
        { status: 403 }
      );
    }

    const { origin } = new URL(request.url);
    const redirectUrl = `${origin}/auth/callback?next=/admin`;

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Tautan login berhasil dikirim ke email admin.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
