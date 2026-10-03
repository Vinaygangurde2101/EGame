import { db } from '../db';
import { emitGameEvent } from '../socket-emitter';
import { logAuditEvent } from './audit-engine';
import { settleRound } from './settlement-engine';
import { getGameLeaderboard } from './leaderboard-engine';

export type GameStatus =
  | 'WAITING'
  | 'ROUND_START'
  | 'QUESTION_LIVE'
  | 'POSITION_SUBMISSION'
  | 'MARKET_LOCKED'
  | 'ANSWER_REVEAL'
  | 'SETTLEMENT'
  | 'PORTFOLIO_UPDATE'
  | 'LEADERBOARD_UPDATE'
  | 'ROUND_RESULT'
  | 'NEXT_ROUND'
  | 'GAME_FINISHED';

export async function transitionGameState(gameId: string, newStatus: GameStatus, metadata: Record<string, any> = {}) {
  const game = await db.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found.`);
  }

  // Update Game status
  const updatedGame = await db.game.update({
    where: { id: gameId },
    data: { status: newStatus },
  });

  // Audit event
  await logAuditEvent({
    gameId,
    eventType: `STATE_CHANGE_${newStatus}`,
    metadata: { previousStatus: game.status, newStatus, ...metadata },
  });

  // Emit realtime notification
  emitGameEvent(gameId, 'game_state_changed', {
    gameId,
    status: newStatus,
    currentRound: updatedGame.currentRound,
    metadata,
  });

  return updatedGame;
}

export async function advanceToNextRound(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
      rounds: { orderBy: { roundNumber: 'asc' } },
    },
  });

  if (!game) throw new Error('Game not found');

  const nextRoundNumber = game.currentRound + 1;

  if (nextRoundNumber > game.questions.length || nextRoundNumber > game.totalRounds) {
    // Game Finished
    await transitionGameState(gameId, 'GAME_FINISHED');
    return { status: 'GAME_FINISHED' };
  }

  const question = game.questions[nextRoundNumber - 1];

  // Determine round type (Special event: Bear Market, Bull Market, Volatility Market, Black Swan, Final Market)
  let roundType = 'Normal Market';
  let multiplier = 1.0;

  if (nextRoundNumber === game.totalRounds) {
    roundType = 'Final Market';
    multiplier = 1.5;
  } else if (nextRoundNumber % 3 === 0) {
    roundType = 'Volatility Market';
    multiplier = 2.0;
  } else if (nextRoundNumber % 4 === 0) {
    roundType = 'Bull Market';
    multiplier = 1.2;
  }

  // Create or get round
  let round = game.rounds.find((r) => r.roundNumber === nextRoundNumber);
  if (!round) {
    round = await db.round.create({
      data: {
        gameId,
        roundNumber: nextRoundNumber,
        roundType,
        multiplier,
        questionId: question.id,
        status: 'LIVE',
        startTime: new Date(),
      },
    });
  } else {
    round = await db.round.update({
      where: { id: round.id },
      data: {
        status: 'LIVE',
        startTime: new Date(),
      },
    });
  }

  // Update Game current round
  await db.game.update({
    where: { id: gameId },
    data: { currentRound: nextRoundNumber, status: 'ROUND_START' },
  });

  // Emit round start event
  emitGameEvent(gameId, 'round_started', {
    gameId,
    roundNumber: nextRoundNumber,
    roundType,
    multiplier,
    questionId: question.id,
    timerSeconds: question.timerSeconds,
    startTime: round.startTime,
  });

  // Automatically lock market when round timer expires (server-side auto-lock)
  const autoLockMs = (question.timerSeconds || 30) * 1000 + 1000;
  const targetRoundId = round.id;
  setTimeout(async () => {
    try {
      const currentRoundState = await db.round.findUnique({
        where: { id: targetRoundId },
      });
      if (currentRoundState && currentRoundState.status === 'LIVE') {
        console.log(`⏱️ Auto-locking market for round ${nextRoundNumber} (game: ${gameId})`);
        await lockMarket(gameId, targetRoundId);
      }
    } catch (e) {
      console.error('Auto-lock error:', e);
    }
  }, autoLockMs);

  return { round, question };
}

export async function lockMarket(gameId: string, roundId: string) {
  await db.round.update({
    where: { id: roundId },
    data: { status: 'LOCKED', lockTime: new Date() },
  });

  await transitionGameState(gameId, 'MARKET_LOCKED');

  emitGameEvent(gameId, 'market_locked', { gameId, roundId });
}

export async function revealAnswer(gameId: string, roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { question: true },
  });

  if (!round || !round.question) throw new Error('Round or question missing');

  await db.round.update({
    where: { id: roundId },
    data: { status: 'REVEALED', revealTime: new Date() },
  });

  await transitionGameState(gameId, 'ANSWER_REVEAL', {
    correctAnswer: round.question.correctAnswer,
    explanation: round.question.explanation,
  });

  emitGameEvent(gameId, 'answer_revealed', {
    gameId,
    roundId,
    correctAnswer: round.question.correctAnswer,
    explanation: round.question.explanation,
  });
}

export async function executeRoundSettlement(gameId: string, roundId: string) {
  const summary = await settleRound(gameId, roundId);
  const leaderboard = await getGameLeaderboard(gameId);

  await transitionGameState(gameId, 'LEADERBOARD_UPDATE', { summary, leaderboard });

  emitGameEvent(gameId, 'settlement_completed', {
    gameId,
    roundId,
    summary,
    leaderboard,
  });

  return { summary, leaderboard };
}
