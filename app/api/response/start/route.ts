import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { version, country, hp } = await req.json();

    if (hp) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const isAllowed = await checkRateLimit(req, 'start_quiz', 10);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { data: settingsRow } = await supabase
      .from('settings_versions')
      .select('settings')
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    const { SETTINGS } = await import('@/lib/settings');
    const quickEnabled = settingsRow?.settings?.QUICK_VERSION_ENABLED ?? SETTINGS.QUICK_VERSION_ENABLED;

    if (version === 'quick' && !quickEnabled) {
      return NextResponse.json({ error: 'The quick version is temporarily disabled during alpha.' }, { status: 400 });
    }

    const public_id = Math.random().toString(36).substring(2, 10);
    const friend_token = Math.random().toString(36).substring(2, 10);
    const secret_token = uuidv4();

    const { data, error } = await supabase
      .from('responses')
      .insert({
        public_id,
        secret_token,
        friend_token,
        status: 'in_progress',
        version,
        country,
        last_section: 'values',
        answers: {},
        dilemma_display_order: {}
      })
      .select('id, public_id, secret_token, friend_token')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
