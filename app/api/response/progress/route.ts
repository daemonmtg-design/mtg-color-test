import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { secret_token, last_section, answers, dilemma_display_order } = await req.json();

    const { error } = await supabase
      .from('responses')
      .update({
        last_section,
        answers,
        dilemma_display_order,
        updated_at: new Date().toISOString()
      })
      .eq('secret_token', secret_token)
      .eq('status', 'in_progress');

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
