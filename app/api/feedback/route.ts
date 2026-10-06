import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { secret_token, accuracy, self_colors, self_unsure } = await req.json();

    // Verify token and get response ID
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('id')
      .eq('secret_token', secret_token)
      .single();

    if (responseError || !response) {
      return NextResponse.json({ error: "Invalid token or response not found" }, { status: 403 });
    }

    // Insert feedback
    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        response_id: response.id,
        accuracy,
        self_colors,
        self_unsure
      });

    if (feedbackError) throw feedbackError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
