import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { getGameLeaderboard } from '@/lib/engines/leaderboard-engine';
import { getQuestionForRoundFromPool } from '@/lib/question-cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = params;
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');

    const cacheKey = `game_api_${gameId}_${participantId || 'anon'}`;
    const cachedResponse = cache.get<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, max-age=1, stale-while-revalidate=2',
        },
      });
    }

    // Lightweight game lookup without fetching all questions and rounds in DB
    const game = await db.game.findFirst({
      where: {
        OR: [{ id: gameId }, { gamePin: gameId }],
      },
      select: {
        id: true,
        name: true,
        gamePin: true,
        status: true,
        startingCapital: true,
        currentRound: true,
        totalRounds: true,
        roundTimerSeconds: true,
        riskLevels: true,
      },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Fetch active round & question from memory pool in parallel
    const [currentRound, rawQuestion] = await Promise.all([
      game.currentRound > 0
        ? db.round.findFirst({
            where: {
              gameId: game.id,
              roundNumber: game.currentRound,
            },
          })
        : Promise.resolve(null),
      game.currentRound > 0
        ? getQuestionForRoundFromPool(game.id, game.currentRound)
        : Promise.resolve(null),
    ]);

    // Parallel execution for participant data & leaderboard
    const [participant, currentPosition, history, leaderboard] = await Promise.all([
      participantId
        ? db.participant.findUnique({
            where: { id: participantId },
            include: { achievements: { include: { achievement: true } } },
          })
        : Promise.resolve(null),
      participantId && currentRound
        ? db.position.findUnique({
            where: {
              participantId_roundId: {
                participantId,
                roundId: currentRound.id,
              },
            },
            include: { riskLevel: true },
          })
        : Promise.resolve(null),
      participantId
        ? db.position.findMany({
            where: { participantId },
            include: {
              round: true,
              riskLevel: true,
              settlement: true,
            },
            orderBy: { submittedAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),
      getGameLeaderboard(game.id),
    ]);

    // Sanitize question if market is live to avoid leaking correct answer
    let activeQuestion = rawQuestion as any;
    if (activeQuestion && game.status !== 'ANSWER_REVEAL' && game.status !== 'LEADERBOARD_UPDATE' && game.status !== 'GAME_FINISHED') {
      const { correctAnswer, ...safeQuestion } = activeQuestion;
      activeQuestion = safeQuestion;
    }

    const payload = {
      success: true,
      game: {
        id: game.id,
        name: game.name,
        gamePin: game.gamePin,
        status: game.status,
        startingCapital: game.startingCapital,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        roundTimerSeconds: game.roundTimerSeconds,
      },
      currentRound,
      activeQuestion,
      riskLevels: game.riskLevels,
      participant,
      currentPosition,
      history,
      leaderboard,
    };

    // Cache payload for 1.5 seconds for instant multi-user throughput
    cache.set(cacheKey, payload, 1500);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, max-age=1, stale-while-revalidate=2',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

