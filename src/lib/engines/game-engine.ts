import { db } from '../db';
import { cache } from '../cache';
import { emitGameEvent } from '../socket-emitter';
import { logAuditEvent } from './audit-engine';
import { settleRound } from './settlement-engine';
import { getGameLeaderboard } from './leaderboard-engine';
import {
  getGameQuestionsFromPool,
  getQuestionForRoundFromPool,
  getQuestionByIdFromPool,
} from '../question-cache';

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
  const game = await db.game.findFirst({
    where: { OR: [{ id: gameId }, { gamePin: gameId }] },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found.`);
  }

  // Update Game status
  const updatedGame = await db.game.update({
    where: { id: game.id },
    data: { status: newStatus },
  });

  // Invalidate in-memory cache for gameId and game.id
  cache.invalidatePattern(game.id);
  cache.invalidatePattern(game.gamePin);

  // Audit event (non-blocking)
  logAuditEvent({
    gameId: game.id,
    eventType: `STATE_CHANGE_${newStatus}`,
    metadata: { previousStatus: game.status, newStatus, ...metadata },
  }).catch((err) => console.error('Audit log error:', err));

  // Emit realtime notification
  emitGameEvent(game.id, 'game_state_changed', {
    gameId: game.id,
    gamePin: game.gamePin,
    status: newStatus,
    currentRound: updatedGame.currentRound,
    metadata,
  });

  return updatedGame;
}

export async function advanceToNextRound(gameId: string) {
  const [game, questions] = await Promise.all([
    db.game.findFirst({
      where: { OR: [{ id: gameId }, { gamePin: gameId }] },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
      },
    }),
    getGameQuestionsFromPool(gameId),
  ]);

  if (!game) throw new Error('Game not found');

  const nextRoundNumber = game.currentRound + 1;

  if (nextRoundNumber > questions.length || nextRoundNumber > game.totalRounds) {
    // Game Finished
    await transitionGameState(game.id, 'GAME_FINISHED');
    return { status: 'GAME_FINISHED' };
  }

  const question = await getQuestionForRoundFromPool(game.id, nextRoundNumber);
  if (!question) throw new Error(`Question for round ${nextRoundNumber} not found.`);

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
        gameId: game.id,
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
    where: { id: game.id },
    data: { currentRound: nextRoundNumber, status: 'ROUND_START' },
  });

  // Invalidate in-memory cache
  cache.invalidatePattern(game.id);
  cache.invalidatePattern(game.gamePin);

  // Sanitize question for broadcast
  const { correctAnswer: _, ...safeQuestionPayload } = question;

  // Emit round start event with rich realtime payload
  emitGameEvent(game.id, 'round_started', {
    gameId: game.id,
    gamePin: game.gamePin,
    status: 'ROUND_START',
    roundNumber: nextRoundNumber,
    roundType,
    multiplier,
    currentRound: round,
    activeQuestion: safeQuestionPayload,
    timerSeconds: question.timerSeconds,
    startTime: round.startTime,
  });

  // Automatically lock market when round timer expires (server-side auto-lock)
  const autoLockMs = (question.timerSeconds || 30) * 1000 + 1000;
  const targetRoundId = round.id;
  const targetGameId = game.id;
  setTimeout(async () => {
    try {
      const currentRoundState = await db.round.findUnique({
        where: { id: targetRoundId },
        include: { game: { select: { status: true } } },
      });
      if (
        currentRoundState &&
        currentRoundState.status === 'LIVE' &&
        ['ROUND_START', 'QUESTION_LIVE', 'POSITION_SUBMISSION'].includes(currentRoundState.game.status)
      ) {
        console.log(`⏱️ Auto-locking market for round ${nextRoundNumber} (game: ${targetGameId})`);
        await lockMarket(targetGameId, targetRoundId);
      }
    } catch (e) {
      console.error('Auto-lock error:', e);
    }
  }, autoLockMs);

  return { round, question };
}

export async function lockMarket(gameId: string, roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { game: { select: { id: true, gamePin: true } } },
  });

  if (!round) throw new Error('Round missing');

  await db.round.update({
    where: { id: roundId },
    data: { status: 'LOCKED', lockTime: new Date() },
  });

  await transitionGameState(round.game.id, 'MARKET_LOCKED');

  emitGameEvent(round.game.id, 'market_locked', {
    gameId: round.game.id,
    gamePin: round.game.gamePin,
    roundId,
    status: 'MARKET_LOCKED',
  });
}

export async function revealAnswer(gameId: string, roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    select: { id: true, questionId: true, gameId: true, game: { select: { id: true, gamePin: true } } },
  });

  if (!round) throw new Error('Round missing');

  const question = round.questionId
    ? await getQuestionByIdFromPool(round.gameId, round.questionId)
    : null;

  if (!question) throw new Error('Question missing');

  await db.round.update({
    where: { id: roundId },
    data: { status: 'REVEALED', revealTime: new Date() },
  });

  await transitionGameState(round.game.id, 'ANSWER_REVEAL', {
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });

  emitGameEvent(round.game.id, 'answer_revealed', {
    gameId: round.game.id,
    gamePin: round.game.gamePin,
    roundId,
    status: 'ANSWER_REVEAL',
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });
}

export async function executeRoundSettlement(gameId: string, roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    select: { gameId: true, game: { select: { id: true, gamePin: true } } },
  });

  if (!round) throw new Error('Round not found');

  const summary = await settleRound(round.game.id, roundId);
  const leaderboard = await getGameLeaderboard(round.game.id);

  await transitionGameState(round.game.id, 'LEADERBOARD_UPDATE', { summary, leaderboard });

  emitGameEvent(round.game.id, 'settlement_completed', {
    gameId: round.game.id,
    gamePin: round.game.gamePin,
    roundId,
    status: 'LEADERBOARD_UPDATE',
    summary,
    leaderboard,
  });

  return { summary, leaderboard };
}




