import { NextRequest, NextResponse } from 'next/server';

import { STORAGE_BUCKET_MASTER } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/supabase';
import { applyWatermark } from '@/lib/watermark';

interface RouteContext {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = context.params;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: 'Token unduhan tidak ditemukan.' },
      { status: 400 }
    );
  }

  const { data: magicToken, error: tokenError } = await supabaseAdmin
    .from('magic_tokens')
    .select(`
      id,
      token,
      expires_at,
      download_count,
      max_downloads,
      grant_id,
      access_grants (
        id,
        email,
        customer_name,
        trx_id,
        ebook_id,
        ebooks (
          id,
          title,
          slug,
          file_path
        )
      )
    `)
    .eq('token', token)
    .maybeSingle();

  if (tokenError || !magicToken) {
    return NextResponse.json(
      { ok: false, message: 'Tautan unduhan tidak valid atau tidak ditemukan.' },
      { status: 404 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(magicToken.expires_at);
  const isExpired = now > expiresAt;
  const isDownloadLimitReached = magicToken.download_count >= magicToken.max_downloads;

  if (isExpired) {
    return NextResponse.json(
      { ok: false, message: 'Tautan unduhan telah kedaluwarsa (lebih dari 48 jam).' },
      { status: 410 }
    );
  }

  if (isDownloadLimitReached) {
    return NextResponse.json(
      { ok: false, message: 'Batas maksimum unduhan (5 kali) telah tercapai.' },
      { status: 403 }
    );
  }

  const grant = Array.isArray(magicToken.access_grants)
    ? magicToken.access_grants[0]
    : magicToken.access_grants;

  if (!grant) {
    return NextResponse.json(
      { ok: false, message: 'Data hak akses tidak ditemukan.' },
      { status: 404 }
    );
  }

  const ebook = Array.isArray(grant.ebooks) ? grant.ebooks[0] : grant.ebooks;
  const filePath = ebook?.file_path || 'Pytorch.pdf';

  const { data: fileData, error: fileError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET_MASTER)
    .download(filePath);

  if (fileError || !fileData) {
    return NextResponse.json(
      { ok: false, message: 'Gagal mengambil file ebook master dari penyimpanan.' },
      { status: 500 }
    );
  }

  const masterArrayBuffer = await fileData.arrayBuffer();

  const watermarkedPdf = await applyWatermark({
    pdfBuffer: masterArrayBuffer,
    email: grant.email,
    name: grant.customer_name ?? undefined,
  });

  await supabaseAdmin
    .from('magic_tokens')
    .update({ download_count: magicToken.download_count + 1 })
    .eq('id', magicToken.id);

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await supabaseAdmin.from('download_logs').insert({
    token_id: magicToken.id,
    email: grant.email,
    ebook_id: ebook?.id || null,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  const downloadFilename = `${ebook?.slug || 'ebook'}-watermarked.pdf`;

  return new NextResponse(Buffer.from(watermarkedPdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      'Content-Length': String(watermarkedPdf.byteLength),
    },
  });
}
