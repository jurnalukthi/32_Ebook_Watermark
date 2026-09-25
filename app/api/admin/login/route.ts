import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

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

    const supabase = createServerSupabaseClient();

    if (password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(
          { ok: false, message: error.message },
          { status: 401 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'Login berhasil.',
        redirectTo: '/admin',
      });
    }

    const { origin } = new URL(request.url);
    const redirectUrl = `${origin}/auth/callback?next=/admin`;

    const { error } = await supabase.auth.signInWithOtp({
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
