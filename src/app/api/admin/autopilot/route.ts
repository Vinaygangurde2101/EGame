import { NextResponse } from 'next/server';
import { setAutoPilot, isAutoPilot } from '@/lib/engines/game-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, enabled } = body;

    if (!gameId || typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'gameId and boolean enabled parameter required' }, { status: 400 });
    }

    const state = setAutoPilot(gameId, enabled);

    return NextResponse.json({ success: true, isAutoPilot: state });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, isAutoPilot: isAutoPilot(gameId) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
