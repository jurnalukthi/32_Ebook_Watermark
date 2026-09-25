import { supabaseAdmin } from './supabase';
import { generateMagicToken, calculateExpiryDate } from './tokens';

interface GrantResult {
  grantId: string;
  token: string;
  ebookId: string;
  isNew: boolean;
}

interface CreateGrantParams {
  email: string;
  ebookId: string;
  source: 'lynk_webhook' | 'manual_admin';
  trxId?: string;
  customerName?: string;
  amount?: number;
}

const TOKEN_EXPIRY_HOURS = 48;
const MAX_TOKEN_DOWNLOADS = 5;

export async function findOrCreateEbook(title: string): Promise<string> {
  const cleanTitle = title.trim();
  const slug = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: existing } = await supabaseAdmin
    .from('ebooks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: created, error } = await supabaseAdmin
    .from('ebooks')
    .insert({
      title: cleanTitle || 'Ebook Master',
      slug: slug || 'default-ebook',
      file_path: `ebooks/${slug || 'default'}.pdf`,
      file_size: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Gagal membuat ebook: ${error?.message}`);
  }

  return created.id;
}

export async function createGrantWithToken(params: CreateGrantParams): Promise<GrantResult> {
  const { email, ebookId, source, trxId, customerName, amount } = params;

  if (trxId) {
    const { data: existingGrant } = await supabaseAdmin
      .from('access_grants')
      .select('id, ebooks(id)')
      .eq('trx_id', trxId)
      .maybeSingle();

    if (existingGrant) {
      const updates: { customer_name?: string; amount?: number } = {};
      if (customerName) {
        updates.customer_name = customerName;
      }
      if (typeof amount === 'number') {
        updates.amount = amount;
      }
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('access_grants')
          .update(updates)
          .eq('id', existingGrant.id);
      }

      const { data: existingToken } = await supabaseAdmin
        .from('magic_tokens')
        .select('token')
        .eq('grant_id', existingGrant.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingToken) {
        return {
          grantId: existingGrant.id,
          token: existingToken.token,
          ebookId,
          isNew: false,
        };
      }
    }
  }

  const { data: grant, error: grantError } = await supabaseAdmin
    .from('access_grants')
    .insert({
      ebook_id: ebookId,
      email,
      source,
      trx_id: trxId ?? null,
      customer_name: customerName ?? null,
      amount: typeof amount === 'number' ? amount : 0,
    })
    .select('id')
    .single();

  if (grantError || !grant) {
    throw new Error(`Gagal membuat access grant: ${grantError?.message}`);
  }

  const token = generateMagicToken();
  const expiresAt = calculateExpiryDate(TOKEN_EXPIRY_HOURS);

  const { error: tokenError } = await supabaseAdmin.from('magic_tokens').insert({
    grant_id: grant.id,
    token,
    expires_at: expiresAt,
    download_count: 0,
    max_downloads: MAX_TOKEN_DOWNLOADS,
  });

  if (tokenError) {
    throw new Error(`Gagal membuat magic token: ${tokenError.message}`);
  }

  return {
    grantId: grant.id,
    token,
    ebookId,
    isNew: true,
  };
}
