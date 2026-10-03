import { Prisma } from '@prisma/client';
import { db } from '../db';
import { calculatePortfolioMetrics } from './portfolio-engine';
import { checkAndAwardAchievements } from './achievement-engine';

export interface SettlementSummary {
  totalParticipants: number;
  totalSettled: number;
  totalWinners: number;
  totalLosers: number;
  totalPayout: number;
  totalLossAmount: number;
  biggestGainer?: { name: string; avatar: string; amount: number };
  biggestLoser?: { name: string; avatar: string; amount: number };
}

export async function settleRound(gameId: string, roundId: string): Promise<SettlementSummary> {
  // Fetch round and question
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: {
      question: true,
      positions: {
        include: {
          participant: true,
          riskLevel: true,
        },
      },
    },
  });

  if (!round || !round.question) {
    throw new Error(`Round ${roundId} or question not found.`);
  }

  if (round.status === 'SETTLED') {
    throw new Error(`Round ${roundId} has already been settled.`);
  }

  const correctAnswer = round.question.correctAnswer;
  let totalWinners = 0;
  let totalLosers = 0;
  let totalPayout = 0;
  let totalLossAmount = 0;
  let biggestGainerAmount = -Infinity;
  let biggestGainer: { name: string; avatar: string; amount: number } | undefined;
  let biggestLoserAmount = Infinity;
  let biggestLoser: { name: string; avatar: string; amount: number } | undefined;

  // Perform transactional settlement for all positions in this round
  await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Fetch all existing settlements for this round in a single query
      const existingSettlements = await tx.settlement.findMany({
        where: { roundId: round.id },
        select: { positionId: true },
      });
      const settledPositionIds = new Set(existingSettlements.map((s) => s.positionId));

      const settlementsToCreate: Prisma.SettlementCreateManyInput[] = [];
      const positionUpdates: Promise<any>[] = [];
      const participantUpdates: Promise<any>[] = [];

      for (const position of round.positions) {
        if (settledPositionIds.has(position.id)) continue;

        const isWin = position.selectedAnswer.toUpperCase() === correctAnswer.toUpperCase();
        const portfolioBefore = position.participant.currentCapital;
        let profitLoss = 0;

        if (isWin) {
          profitLoss = position.potentialWin;
          totalWinners++;
          totalPayout += profitLoss;
        } else {
          profitLoss = -position.potentialLoss;
          totalLosers++;
          totalLossAmount += position.potentialLoss;
        }

        const portfolioAfter = Math.max(0, portfolioBefore + profitLoss);
        const newTotalProfit = isWin ? position.participant.totalProfit + profitLoss : position.participant.totalProfit;
        const newTotalLoss = !isWin ? position.participant.totalLoss + position.potentialLoss : position.participant.totalLoss;
        const newStreak = isWin ? position.participant.streakCount + 1 : 0;

        const metrics = calculatePortfolioMetrics(
          position.participant.startingCapital,
          portfolioAfter,
          newTotalProfit,
          newTotalLoss,
          0
        );

        settlementsToCreate.push({
          positionId: position.id,
          participantId: position.participantId,
          roundId: round.id,
          result: isWin ? 'WIN' : 'LOSS',
          profitLoss,
          portfolioBefore,
          portfolioAfter,
        });

        positionUpdates.push(
          tx.position.update({
            where: { id: position.id },
            data: { status: 'SETTLED' },
          })
        );

        participantUpdates.push(
          tx.participant.update({
            where: { id: position.participantId },
            data: {
              currentCapital: portfolioAfter,
              availableCash: portfolioAfter,
              exposedCapital: 0,
              totalProfit: newTotalProfit,
              totalLoss: newTotalLoss,
              netPnL: metrics.netPnL,
              returnPercentage: metrics.returnPercentage,
              streakCount: newStreak,
            },
          })
        );

        // Track market movers
        if (profitLoss > biggestGainerAmount) {
          biggestGainerAmount = profitLoss;
          biggestGainer = {
            name: position.participant.displayName,
            avatar: position.participant.avatar,
            amount: profitLoss,
          };
        }

        if (profitLoss < biggestLoserAmount) {
          biggestLoserAmount = profitLoss;
          biggestLoser = {
            name: position.participant.displayName,
            avatar: position.participant.avatar,
            amount: profitLoss,
          };
        }
      }

      // Batch insert settlements
      if (settlementsToCreate.length > 0) {
        await tx.settlement.createMany({
          data: settlementsToCreate,
        });
      }

      // Execute updates in parallel within transaction
      await Promise.all([...positionUpdates, ...participantUpdates]);

      // Mark round as SETTLED
      await tx.round.update({
        where: { id: round.id },
        data: {
          status: 'SETTLED',
          settlementTime: new Date(),
        },
      });

      // Update game status
      await tx.game.update({
        where: { id: gameId },
        data: { status: 'SETTLEMENT' },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          gameId,
          roundId,
          eventType: 'SETTLEMENT_COMPLETED',
          metadata: JSON.stringify({
            correctAnswer,
            totalWinners,
            totalLosers,
            totalPayout,
            totalLossAmount,
          }),
        },
      });
    },
    {
      timeout: 30000, // Extend timeout for high-concurrency batches
    }
  );

  // Evaluate achievements concurrently in parallel batches
  try {
    const participantIds = Array.from(new Set(round.positions.map((p) => p.participantId)));
    await Promise.all(participantIds.map((pid) => checkAndAwardAchievements(pid, gameId)));
  } catch (err) {
    console.error('Error evaluating achievements:', err);
  }

  return {
    totalParticipants: round.positions.length,
    totalSettled: round.positions.length,
    totalWinners,
    totalLosers,
    totalPayout,
    totalLossAmount,
    biggestGainer: biggestGainerAmount > 0 ? biggestGainer : undefined,
    biggestLoser: biggestLoserAmount < 0 ? biggestLoser : undefined,
  };
}
