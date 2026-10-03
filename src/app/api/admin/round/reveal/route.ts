import { NextResponse } from 'next/server';
import { revealAnswer } from '@/lib/engines/game-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, roundId } = body;

    if (!gameId || !roundId) {
      return NextResponse.json({ success: false, error: 'gameId and roundId required' }, { status: 400 });
    }

    await revealAnswer(gameId, roundId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
