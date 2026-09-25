import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/admin/login`, { status: 303 });
}
