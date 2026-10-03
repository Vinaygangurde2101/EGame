import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/engines/audit-engine';
import { emitGameEvent } from '@/lib/socket-emitter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gamePin, displayName, avatar = 'bull' } = body;

    if (!gamePin || !displayName) {
      return NextResponse.json({ success: false, error: 'Game PIN and Name are required.' }, { status: 400 });
    }

    const game = await db.game.findUnique({
      where: { gamePin: gamePin.trim() },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Invalid Game PIN. Please check and try again.' }, { status: 404 });
    }

    if (game.status === 'GAME_FINISHED') {
      return NextResponse.json({ success: false, error: 'This game has already ended.' }, { status: 400 });
    }

    // Check existing participant in this game with same name
    let participant = await db.participant.findFirst({
      where: { gameId: game.id, displayName: displayName.trim() },
    });

    if (!participant) {
      participant = await db.participant.create({
        data: {
          gameId: game.id,
          displayName: displayName.trim(),
          avatar,
          startingCapital: game.startingCapital,
          currentCapital: game.startingCapital,
          availableCash: game.startingCapital,
          exposedCapital: 0,
        },
      });

      await logAuditEvent({
        gameId: game.id,
        participantId: participant.id,
        eventType: 'PLAYER_JOINED',
        metadata: { displayName, avatar },
      });

      // Emit realtime event
      emitGameEvent(game.id, 'player_joined', {
        gameId: game.id,
        participantId: participant.id,
        displayName: participant.displayName,
        avatar: participant.avatar,
      });
    }

    return NextResponse.json({
      success: true,
      gameId: game.id,
      participant,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
