import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { calculateRiskExposure } from '@/lib/engines/risk-engine';
import { logAuditEvent } from '@/lib/engines/audit-engine';
import { emitGameEvent } from '@/lib/socket-emitter';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { participantId, roundId, selectedAnswer, riskLevelId } = body;

    if (!participantId || !roundId || !selectedAnswer || !riskLevelId) {
      return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    }

    // Validate answer value
    const cleanAnswer = selectedAnswer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(cleanAnswer)) {
      return NextResponse.json({ success: false, error: 'Invalid option selected.' }, { status: 400 });
    }

    // Fast parallel fetching for participant, round, and risk level
    const [participant, round, riskLevel] = await Promise.all([
      db.participant.findUnique({ where: { id: participantId } }),
      db.round.findUnique({ where: { id: roundId }, include: { game: true } }),
      db.riskLevel.findUnique({ where: { id: riskLevelId } }),
    ]);

    if (!participant || !round || !riskLevel) {
      return NextResponse.json({ success: false, error: 'Invalid participant, round, or risk configuration.' }, { status: 400 });
    }

    // Strict state validation: Market must be open & active
    const allowedGameStatuses = ['ROUND_START', 'QUESTION_LIVE', 'POSITION_SUBMISSION'];
    if (
      !allowedGameStatuses.includes(round.game.status) ||
      round.status !== 'LIVE'
    ) {
      return NextResponse.json({ success: false, error: 'Market is locked. Position submissions are closed.' }, { status: 400 });
    }

    // Capital check: bankrupt traders cannot place market orders
    if (participant.currentCapital <= 0) {
      return NextResponse.json({ success: false, error: 'Insufficient portfolio capital to place trade.' }, { status: 400 });
    }

    // Check duplicate submission
    const existingPosition = await db.position.findUnique({
      where: {
        participantId_roundId: {
          participantId,
          roundId,
        },
      },
      select: { id: true },
    });

    if (existingPosition) {
      return NextResponse.json({ success: false, error: 'Position already locked for this round.' }, { status: 400 });
    }

    // Calculate capital exposure using server risk engine
    const { exposedCapital, potentialWin, potentialLoss } = calculateRiskExposure(
      participant.currentCapital,
      {
        exposurePercentage: riskLevel.exposurePercentage,
        winningReturn: riskLevel.winningReturn,
        losingRate: riskLevel.losingRate,
      },
      round.multiplier
    );

    // Transactional position creation with P2002 race condition handling
    let position;
    try {
      position = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const pos = await tx.position.create({
          data: {
            participantId,
            roundId,
            selectedAnswer: cleanAnswer,
            riskLevelId,
            exposedCapital,
            potentialWin,
            potentialLoss,
            status: 'LOCKED',
          },
        });

        await tx.participant.update({
          where: { id: participantId },
          data: {
            exposedCapital,
            availableCash: Math.max(0, participant.currentCapital - exposedCapital),
          },
        });

        return pos;
      });
    } catch (txErr: any) {
      if (txErr instanceof Prisma.PrismaClientKnownRequestError && txErr.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Position already locked for this round.' }, { status: 400 });
      }
      throw txErr;
    }

    // Invalidate cached state for fast reactivity
    cache.invalidatePattern(`game_api_${round.gameId}`);

    // Asynchronous non-blocking audit logging
    logAuditEvent({
      gameId: round.gameId,
      participantId,
      roundId,
      eventType: 'POSITION_SUBMITTED',
      metadata: {
        selectedAnswer: cleanAnswer,
        riskLevel: riskLevel.name,
        exposedCapital,
        potentialWin,
        potentialLoss,
      },
    }).catch((err) => console.error('Audit log error:', err));

    // Realtime broadcast to admin & arena
    emitGameEvent(round.gameId, 'position_submitted', {
      gameId: round.gameId,
      roundId,
      participantId,
      selectedAnswer: cleanAnswer,
      riskLevel: riskLevel.name,
      exposedCapital,
    });

    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


