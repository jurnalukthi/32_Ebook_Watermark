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

async function isAuthenticatedAdmin(): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user && user.email === ADMIN_EMAIL);
}

export async function GET() {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { ok: false, message: 'Akses ditolak. Sesi tidak sah.' },
        { status: 403 }
      );
    }

    const { data: ebooks, error } = await supabaseAdmin
      .from('ebooks')
      .select('id, title, slug, file_path, file_size, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, ebooks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
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

export async function PATCH(request: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { ok: false, message: 'Akses ditolak. Sesi tidak sah.' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let id = '';
    let title: string | undefined;
    let isActive: boolean | undefined;
    let file: Blob | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      id = String(formData.get('id') || '');
      const rawTitle = formData.get('title');
      if (typeof rawTitle === 'string' && rawTitle.trim()) {
        title = rawTitle.trim();
      }
      const rawIsActive = formData.get('is_active');
      if (rawIsActive !== null) {
        isActive = rawIsActive === 'true' || rawIsActive === '1';
      }
      const rawFile = formData.get('file');
      if (rawFile instanceof Blob && rawFile.size > 0) {
        file = rawFile;
      }
    } else {
      const body = await request.json();
      id = String(body.id || '');
      if (typeof body.title === 'string' && body.title.trim()) {
        title = body.title.trim();
      }
      if (typeof body.is_active === 'boolean') {
        isActive = body.is_active;
      }
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, message: 'ID e-book wajib disertakan.' },
        { status: 400 }
      );
    }

    const { data: existingEbook, error: fetchError } = await supabaseAdmin
      .from('ebooks')
      .select('id, title, slug, file_path, file_size, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !existingEbook) {
      return NextResponse.json(
        { ok: false, message: 'E-book tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updates: {
      title?: string;
      slug?: string;
      file_path?: string;
      file_size?: number;
      is_active?: boolean;
    } = {};

    if (title && title !== existingEbook.title) {
      updates.title = title;
      updates.slug = createSlug(title);
    }

    if (typeof isActive === 'boolean') {
      updates.is_active = isActive;
    }

    if (file) {
      const baseSlug = updates.slug || existingEbook.slug;
      const newStoragePath = `${baseSlug}-${Date.now()}.pdf`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET_MASTER)
        .upload(newStoragePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json(
          { ok: false, message: `Gagal mengunggah file baru: ${uploadError.message}` },
          { status: 500 }
        );
      }

      if (existingEbook.file_path) {
        await supabaseAdmin.storage
          .from(STORAGE_BUCKET_MASTER)
          .remove([existingEbook.file_path]);
      }

      updates.file_path = newStoragePath;
      updates.file_size = buffer.byteLength;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Tidak ada perubahan yang dilakukan.',
        ebook: existingEbook,
      });
    }

    const { data: updatedEbook, error: updateError } = await supabaseAdmin
      .from('ebooks')
      .update(updates)
      .eq('id', id)
      .select('id, title, slug, file_path, file_size, is_active, created_at')
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: `Gagal memperbarui e-book: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'E-book berhasil diperbarui.',
      ebook: updatedEbook,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { ok: false, message: 'Akses ditolak. Sesi tidak sah.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // Body might be empty
      }
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, message: 'ID e-book wajib disertakan.' },
        { status: 400 }
      );
    }

    const { data: existingEbook, error: fetchError } = await supabaseAdmin
      .from('ebooks')
      .select('id, file_path')
      .eq('id', id)
      .single();

    if (fetchError || !existingEbook) {
      return NextResponse.json(
        { ok: false, message: 'E-book tidak ditemukan.' },
        { status: 404 }
      );
    }

    await supabaseAdmin
      .from('access_grants')
      .update({ ebook_id: null })
      .eq('ebook_id', id);

    const { error: deleteError } = await supabaseAdmin
      .from('ebooks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { ok: false, message: `Gagal menghapus e-book: ${deleteError.message}` },
        { status: 500 }
      );
    }

    if (existingEbook.file_path) {
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET_MASTER)
        .remove([existingEbook.file_path]);
    }

    return NextResponse.json({
      ok: true,
      message: 'E-book berhasil dihapus.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kendala server.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
