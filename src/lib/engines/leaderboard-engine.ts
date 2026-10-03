import { db } from '../db';
import { cache } from '../cache';

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  rankMovement: 'UP' | 'DOWN' | 'SAME' | 'NEW';
  participantId: string;
  displayName: string;
  avatar: string;
  currentCapital: number;
  startingCapital: number;
  netPnL: number;
  returnPercentage: number;
  lastRoundPnL: number;
  accuracy: number;
  streakCount: number;
  achievementsCount: number;
}

export async function getGameLeaderboard(gameId: string, currentRoundNumber?: number): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard_${gameId}`;
  const cached = cache.get<LeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  const game = await db.game.findFirst({
    where: { OR: [{ id: gameId }, { gamePin: gameId }] },
    select: { id: true },
  });

  if (!game) return [];

  const participants = await db.participant.findMany({
    where: { gameId: game.id },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      currentCapital: true,
      startingCapital: true,
      netPnL: true,
      returnPercentage: true,
      streakCount: true,
      settlements: {
        select: {
          result: true,
          profitLoss: true,
        },
        orderBy: { settledAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          achievements: true,
          positions: true,
        },
      },
    },
    orderBy: [
      { currentCapital: 'desc' },
      { netPnL: 'desc' },
    ],
  });

  // Calculate scores for each participant
  const entries = participants.map((p) => {
    const totalPositions = p._count.positions;
    const wins = p.settlements.filter((s) => s.result === 'WIN').length;
    const accuracy = totalPositions > 0 ? Math.round((wins / totalPositions) * 100) : 0;

    // Get last round P&L
    let lastRoundPnL = 0;
    if (p.settlements.length > 0) {
      lastRoundPnL = p.settlements[0].profitLoss;
    }

    return {
      participantId: p.id,
      displayName: p.displayName,
      avatar: p.avatar,
      currentCapital: p.currentCapital,
      startingCapital: p.startingCapital,
      netPnL: p.netPnL,
      returnPercentage: p.returnPercentage,
      lastRoundPnL,
      accuracy,
      streakCount: p.streakCount,
      achievementsCount: p._count.achievements,
      sortKey: p.currentCapital * 1000 + p.netPnL + accuracy,
    };
  });

  // Sort descending by sortKey
  entries.sort((a, b) => b.sortKey - a.sortKey);

  // Assign ranks & calculate movements
  const leaderboard: LeaderboardEntry[] = entries.map((entry, index) => {
    const rank = index + 1;
    let rankMovement: 'UP' | 'DOWN' | 'SAME' | 'NEW' = 'SAME';
    if (entry.lastRoundPnL > 0) rankMovement = 'UP';
    else if (entry.lastRoundPnL < 0) rankMovement = 'DOWN';

    return {
      rank,
      rankMovement,
      participantId: entry.participantId,
      displayName: entry.displayName,
      avatar: entry.avatar,
      currentCapital: entry.currentCapital,
      startingCapital: entry.startingCapital,
      netPnL: entry.netPnL,
      returnPercentage: entry.returnPercentage,
      lastRoundPnL: entry.lastRoundPnL,
      accuracy: entry.accuracy,
      streakCount: entry.streakCount,
      achievementsCount: entry.achievementsCount,
    };
  });

  // Cache leaderboard results for fast concurrent access
  cache.set(cacheKey, leaderboard, 2000);

  return leaderboard;
}

