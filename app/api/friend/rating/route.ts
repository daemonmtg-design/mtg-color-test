import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const STATEMENTS = [
  { id: 1, trait: "E", r: false }, { id: 2, trait: "A", r: false },
  { id: 3, trait: "C", r: false }, { id: 4, trait: "N", r: false },
  { id: 5, trait: "O", r: false }, { id: 6, trait: "E", r: true },
  { id: 7, trait: "A", r: true }, { id: 8, trait: "C", r: true },
  { id: 9, trait: "N", r: true }, { id: 10, trait: "O", r: true },
  { id: 11, trait: "E", r: false }, { id: 12, trait: "A", r: false },
  { id: 13, trait: "C", r: false }, { id: 14, trait: "N", r: false },
  { id: 15, trait: "O", r: true }, { id: 16, trait: "E", r: true },
  { id: 17, trait: "A", r: true }, { id: 18, trait: "C", r: true },
  { id: 19, trait: "N", r: true }, { id: 20, trait: "O", r: true }
];

export async function POST(req: Request) {
  try {
    const { friend_token, relationship, known_for, answers, colors, colors_unsure, hp } = await req.json();

    if (hp) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const isAllowed = await checkRateLimit(req, 'friend_rating', 10);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('id')
      .eq('friend_token', friend_token)
      .single();

    if (responseError || !response) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const { count } = await supabase
      .from('friend_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('response_id', response.id);

    if (count !== null && count >= 5) {
      return NextResponse.json({ error: "Limit reached" }, { status: 403 });
    }

    // Compute trait scores
    const traitSums: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const traitCounts: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

    STATEMENTS.forEach(s => {
      let val = answers[s.id];
      if (val !== undefined) {
        if (s.r) val = 6 - val;
        traitSums[s.trait] += val;
        traitCounts[s.trait] += 1;
      }
    });

    const trait_scores: Record<string, number> = {};
    for (const t of ["O", "C", "E", "A", "N"]) {
      trait_scores[t] = traitCounts[t] > 0 ? traitSums[t] / traitCounts[t] : 0;
    }

    const { error: insertError } = await supabase
      .from('friend_ratings')
      .insert({
        response_id: response.id,
        relationship,
        known_for,
        answers,
        trait_scores,
        colors,
        colors_unsure
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
