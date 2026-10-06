import { NextResponse } from 'next/server';
import { getSanitizedQuizData } from '../../../lib/quiz-data';

export async function GET() {
  try {
    const data = getSanitizedQuizData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
