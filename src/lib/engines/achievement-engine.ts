import { db } from '../db';

export const INITIAL_ACHIEVEMENTS = [
  {
    name: 'KNOWLEDGE MASTER',
    description: 'Achieve 5 consecutive correct predictions.',
    icon: 'Brain',
    category: 'Accuracy',
  },
  {
    name: 'HIGH CONVICTION',
    description: 'Win a round using HIGH or EXTREME risk exposure.',
    icon: 'Zap',
    category: 'Risk',
  },
  {
    name: 'RISK MANAGER',
    description: 'Complete 3 rounds while maintaining prudent risk exposure.',
    icon: 'ShieldCheck',
    category: 'Strategy',
  },
  {
    name: 'COMEBACK KID',
    description: 'Recover to positive total P&L after experiencing a drawdown.',
    icon: 'TrendingUp',
    category: 'Resilience',
  },
  {
    name: 'MARKET SHOCK',
    description: 'Gain over ₹2,500 in a single round.',
    icon: 'Flame',
    category: 'Returns',
  },
  {
    name: 'DIAMOND HANDS',
    description: 'End 5 consecutive rounds with portfolio above starting capital.',
    icon: 'Gem',
    category: 'Capital',
  },
];

let isAchievementsInitialized = false;

export async function ensureAchievementsExist() {
  if (isAchievementsInitialized) return;
  const count = await db.achievement.count();
  if (count < INITIAL_ACHIEVEMENTS.length) {
    for (const ach of INITIAL_ACHIEVEMENTS) {
      await db.achievement.upsert({
        where: { name: ach.name },
        update: { description: ach.description, icon: ach.icon, category: ach.category },
        create: ach,
      });
    }
  }
  isAchievementsInitialized = true;
}

export async function checkAndAwardAchievements(participantId: string, gameId: string) {
  await ensureAchievementsExist();

  const participant = await db.participant.findUnique({
    where: { id: participantId },
    include: {
      settlements: {
        include: {
          position: {
            include: { riskLevel: true },
          },
        },
        orderBy: { settledAt: 'asc' },
      },
      achievements: { include: { achievement: true } },
    },
  });

  if (!participant) return;

  const earnedNames = new Set(participant.achievements.map((a) => a.achievement.name));
  const newAwards: string[] = [];

  // 1. KNOWLEDGE MASTER (Streak >= 5)
  if (participant.streakCount >= 5 && !earnedNames.has('KNOWLEDGE MASTER')) {
    newAwards.push('KNOWLEDGE MASTER');
  }

  // 2. HIGH CONVICTION (Won with HIGH or EXTREME risk)
  const wonHighRisk = participant.settlements.some(
    (s) => s.result === 'WIN' && (s.position.riskLevel.name === 'HIGH' || s.position.riskLevel.name === 'EXTREME')
  );
  if (wonHighRisk && !earnedNames.has('HIGH CONVICTION')) {
    newAwards.push('HIGH CONVICTION');
  }

  // 3. MARKET SHOCK (Single round P&L >= 2500)
  const hugeWin = participant.settlements.some((s) => s.profitLoss >= 2500);
  if (hugeWin && !earnedNames.has('MARKET SHOCK')) {
    newAwards.push('MARKET SHOCK');
  }

  // 4. COMEBACK KID (Net PnL > 0 and had previous losses)
  if (participant.netPnL > 0 && participant.totalLoss > 0 && !earnedNames.has('COMEBACK KID')) {
    newAwards.push('COMEBACK KID');
  }

  // 5. DIAMOND HANDS (5+ settlements and portfolio > starting capital)
  if (participant.settlements.length >= 5 && participant.currentCapital > participant.startingCapital && !earnedNames.has('DIAMOND HANDS')) {
    newAwards.push('DIAMOND HANDS');
  }

  // Award achievements
  for (const achName of newAwards) {
    const ach = await db.achievement.findUnique({ where: { name: achName } });
    if (ach) {
      await db.participantAchievement.create({
        data: {
          participantId,
          achievementId: ach.id,
        },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          gameId,
          participantId,
          eventType: 'ACHIEVEMENT_UNLOCKED',
          metadata: JSON.stringify({ achievement: achName }),
        },
      });
    }
  }
}
