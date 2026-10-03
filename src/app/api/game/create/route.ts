import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/engines/audit-engine';
import { DEFAULT_RISK_LEVELS } from '@/lib/engines/risk-engine';
import { ensureGameQuestionsExist } from '@/lib/engines/question-defaults';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, startingCapital = 10000, totalRounds = 10, roundTimerSeconds = 30 } = body;

    // Generate 6-digit PIN
    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();

    const game = await db.game.create({
      data: {
        name: name || 'Knowledge Exchange Live Championship',
        gamePin,
        startingCapital,
        totalRounds,
        roundTimerSeconds,
        status: 'WAITING',
      },
    });

    // Create default risk levels for this game
    for (const risk of DEFAULT_RISK_LEVELS) {
      await db.riskLevel.create({
        data: {
          gameId: game.id,
          ...risk,
        },
      });
    }

    // Auto-populate 10 default financial questions for this game
    await ensureGameQuestionsExist(game.id);

    await logAuditEvent({
      gameId: game.id,
      eventType: 'GAME_CREATED',
      metadata: { gamePin, startingCapital, totalRounds },
    });

    return NextResponse.json({ success: true, game });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
