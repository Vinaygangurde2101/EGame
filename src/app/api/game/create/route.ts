import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/engines/audit-engine';
import { DEFAULT_RISK_LEVELS } from '@/lib/engines/risk-engine';
import { ensureGameQuestionsExist } from '@/lib/engines/question-defaults';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, startingCapital = 10000, totalRounds = 10, roundTimerSeconds = 30 } = body;

    // Generate guaranteed unique 6-digit PIN
    let gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    let isUniquePin = false;
    let attempts = 0;

    while (!isUniquePin && attempts < 10) {
      const existing = await db.game.findUnique({ where: { gamePin }, select: { id: true } });
      if (!existing) {
        isUniquePin = true;
      } else {
        gamePin = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
      }
    }

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

    // Bulk create default risk levels for this game in a single query
    await db.riskLevel.createMany({
      data: DEFAULT_RISK_LEVELS.map((risk) => ({
        gameId: game.id,
        ...risk,
      })),
    });

    // Auto-populate 10 default financial questions for this game
    await ensureGameQuestionsExist(game.id);

    // Non-blocking audit log
    logAuditEvent({
      gameId: game.id,
      eventType: 'GAME_CREATED',
      metadata: { gamePin, startingCapital, totalRounds },
    }).catch((err) => console.error('Audit log error:', err));

    return NextResponse.json({ success: true, game });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

