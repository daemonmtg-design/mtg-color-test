import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SETTINGS } from '@/lib/settings';

export async function GET() {
  const { data: settingsRow } = await supabase
    .from('settings_versions')
    .select('settings')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  const quickEnabled = settingsRow?.settings?.QUICK_VERSION_ENABLED ?? SETTINGS.QUICK_VERSION_ENABLED;

  return NextResponse.json({ quickEnabled });
}
