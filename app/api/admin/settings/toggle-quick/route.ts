import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  if (authError || !user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role for DB
  const { supabase: adminSupabase } = await import('@/lib/supabase');

  // Fetch active
  const { data: activeVersion } = await adminSupabase
    .from('settings_versions')
    .select('*')
    .eq('active', true)
    .single();

  if (!activeVersion) {
    return NextResponse.json({ error: 'No active version' }, { status: 400 });
  }

  // Toggle
  const currentEnabled = activeVersion.settings?.QUICK_VERSION_ENABLED ?? false;
  const newSettings = { ...activeVersion.settings, QUICK_VERSION_ENABLED: !currentEnabled };

  // Create new version and activate it
  const { data: newVersion, error: insertError } = await adminSupabase
    .from('settings_versions')
    .insert([{
      note: `Toggled Quick Version to ${!currentEnabled}`,
      settings: newSettings,
      typical_values: activeVersion.typical_values,
      norms: activeVersion.norms,
      active: true
    }])
    .select('*')
    .single();

  if (insertError) throw insertError;

  // Deactivate old version
  await adminSupabase.from('settings_versions').update({ active: false }).eq('id', activeVersion.id);

  return NextResponse.json(newVersion);
}
