import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getGameLeaderboard } from '@/lib/engines/leaderboard-engine';

export async function GET(req: Request, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = params;
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');

    const game = await db.game.findFirst({
      where: {
        OR: [{ id: gameId }, { gamePin: gameId }],
      },
      include: {
        riskLevels: true,
        questions: { orderBy: { orderIndex: 'asc' } },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: { question: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Current active round
    const currentRound = game.rounds.find((r: { roundNumber: number }) => r.roundNumber === game.currentRound) || null;

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
              round: { include: { question: true } },
              riskLevel: true,
              settlement: true,
            },
            orderBy: { submittedAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
      getGameLeaderboard(game.id),
    ]);

    // Sanitize question if market is live to avoid leaking correct answer
    let activeQuestion = currentRound?.question || null;
    if (activeQuestion && game.status !== 'ANSWER_REVEAL' && game.status !== 'LEADERBOARD_UPDATE' && game.status !== 'GAME_FINISHED') {
      const { correctAnswer, ...safeQuestion } = activeQuestion;
      activeQuestion = safeQuestion as any;
    }

    return NextResponse.json({
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
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
