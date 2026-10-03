import { NextResponse } from 'next/server';
import { executeRoundSettlement } from '@/lib/engines/game-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, roundId } = body;

    if (!gameId || !roundId) {
      return NextResponse.json({ success: false, error: 'gameId and roundId required' }, { status: 400 });
    }

    const { summary, leaderboard } = await executeRoundSettlement(gameId, roundId);
    return NextResponse.json({ success: true, summary, leaderboard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
