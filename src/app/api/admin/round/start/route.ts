import { NextResponse } from 'next/server';
import { advanceToNextRound } from '@/lib/engines/game-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });
    }

    const result = await advanceToNextRound(gameId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
