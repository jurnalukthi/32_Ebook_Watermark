import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_EMAIL, STORAGE_BUCKET_MASTER } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function createSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('file');

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Judul e-book wajib diisi.' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, message: 'File PDF master wajib diunggah.' },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const slug = createSlug(cleanTitle);
    const storagePath = `${slug}-${Date.now()}.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_MASTER)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, message: `Gagal mengunggah file ke storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: createdEbook, error: insertError } = await supabaseAdmin
      .from('ebooks')
      .insert({
        title: cleanTitle,
        slug,
        file_path: storagePath,
        file_size: buffer.byteLength,
        is_active: true,
      })
      .select('id, title, slug, file_path, file_size, is_active, created_at')
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, message: `Gagal menyimpan metadata e-book: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'E-book master berhasil diunggah.',
      ebook: createdEbook,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
