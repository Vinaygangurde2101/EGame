import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = params;

    const game = await db.game.findFirst({
      where: { OR: [{ id: gameId }, { gamePin: gameId }] },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    const participants = await db.participant.findMany({
      where: { gameId: game.id },
      include: {
        positions: {
          include: { riskLevel: true, settlement: true },
        },
      },
    });

    const rounds = await db.round.findMany({
      where: { gameId: game.id },
      include: {
        positions: {
          include: { riskLevel: true },
        },
      },
    });

    // 1. Capital Exposure
    let totalCapital = 0;
    let capitalExposed = 0;
    participants.forEach((p) => {
      totalCapital += p.currentCapital;
      capitalExposed += p.exposedCapital;
    });

    const exposureRatio = totalCapital > 0 ? ((capitalExposed / totalCapital) * 100).toFixed(2) : '0.00';

    // 2. Answer Distribution across all positions
    const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    let totalPositionsSubmitted = 0;

    // 3. Risk Distribution
    const riskCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, EXTREME: 0 };

    rounds.forEach((r) => {
      r.positions.forEach((pos) => {
        totalPositionsSubmitted++;
        answerCounts[pos.selectedAnswer] = (answerCounts[pos.selectedAnswer] || 0) + 1;
        riskCounts[pos.riskLevel.name] = (riskCounts[pos.riskLevel.name] || 0) + 1;
      });
    });

    const answerDistribution = {
      A: totalPositionsSubmitted > 0 ? Math.round((answerCounts.A / totalPositionsSubmitted) * 100) : 0,
      B: totalPositionsSubmitted > 0 ? Math.round((answerCounts.B / totalPositionsSubmitted) * 100) : 0,
      C: totalPositionsSubmitted > 0 ? Math.round((answerCounts.C / totalPositionsSubmitted) * 100) : 0,
      D: totalPositionsSubmitted > 0 ? Math.round((answerCounts.D / totalPositionsSubmitted) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      analytics: {
        totalParticipants: participants.length,
        totalCapital,
        capitalExposed,
        exposureRatio: parseFloat(exposureRatio),
        totalPositionsSubmitted,
        answerDistribution,
        riskCounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
