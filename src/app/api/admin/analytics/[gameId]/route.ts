import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export async function GET(req: Request, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = params;
    const cacheKey = `analytics_${gameId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const game = await db.game.findFirst({
      where: { OR: [{ id: gameId }, { gamePin: gameId }] },
      select: { id: true },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Fast parallel database aggregations
    const [participantAgg, activeRound] = await Promise.all([
      db.participant.aggregate({
        where: { gameId: game.id },
        _sum: {
          currentCapital: true,
          exposedCapital: true,
        },
        _count: true,
      }),
      db.round.findFirst({
        where: { gameId: game.id, status: { in: ['LIVE', 'LOCKED', 'REVEALED'] } },
        orderBy: { roundNumber: 'desc' },
        include: {
          positions: {
            select: {
              selectedAnswer: true,
              riskLevel: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const totalParticipants = participantAgg._count || 0;
    const totalCapital = participantAgg._sum.currentCapital || 0;
    const capitalExposed = participantAgg._sum.exposedCapital || 0;
    const exposureRatio = totalCapital > 0 ? ((capitalExposed / totalCapital) * 100).toFixed(2) : '0.00';

    const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const riskCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, EXTREME: 0 };
    let totalPositionsSubmitted = 0;

    if (activeRound) {
      activeRound.positions.forEach((pos) => {
        totalPositionsSubmitted++;
        if (answerCounts[pos.selectedAnswer] !== undefined) {
          answerCounts[pos.selectedAnswer]++;
        }
        if (pos.riskLevel?.name && riskCounts[pos.riskLevel.name] !== undefined) {
          riskCounts[pos.riskLevel.name]++;
        }
      });
    }

    const answerDistribution = {
      A: totalPositionsSubmitted > 0 ? Math.round((answerCounts.A / totalPositionsSubmitted) * 100) : 0,
      B: totalPositionsSubmitted > 0 ? Math.round((answerCounts.B / totalPositionsSubmitted) * 100) : 0,
      C: totalPositionsSubmitted > 0 ? Math.round((answerCounts.C / totalPositionsSubmitted) * 100) : 0,
      D: totalPositionsSubmitted > 0 ? Math.round((answerCounts.D / totalPositionsSubmitted) * 100) : 0,
    };

    const payload = {
      success: true,
      analytics: {
        totalParticipants,
        totalCapital,
        capitalExposed,
        exposureRatio: parseFloat(exposureRatio),
        totalPositionsSubmitted,
        answerDistribution,
        riskCounts,
      },
    };

    cache.set(cacheKey, payload, 2000);

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

