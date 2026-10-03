const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Knowledge Exchange database...');

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@knowledgeexchange.io' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@knowledgeexchange.io',
      role: 'ADMIN',
    },
  });

  // 2. Create Demo Game
  const game = await prisma.game.upsert({
    where: { gamePin: '777888' },
    update: {},
    create: {
      name: 'Global Financial Knowledge Championship',
      gamePin: '777888',
      status: 'WAITING',
      startingCapital: 10000,
      currentRound: 0,
      totalRounds: 10,
      roundTimerSeconds: 30,
    },
  });

  // 3. Create Default Risk Levels for Game
  const defaultRisks = [
    { name: 'LOW', exposurePercentage: 0.10, winningReturn: 0.10, losingRate: 0.05, color: 'emerald' },
    { name: 'MEDIUM', exposurePercentage: 0.25, winningReturn: 0.25, losingRate: 0.15, color: 'cyan' },
    { name: 'HIGH', exposurePercentage: 0.50, winningReturn: 0.50, losingRate: 0.35, color: 'amber' },
    { name: 'EXTREME', exposurePercentage: 0.75, winningReturn: 1.00, losingRate: 0.75, color: 'rose' },
  ];

  for (const risk of defaultRisks) {
    const existing = await prisma.riskLevel.findFirst({
      where: { gameId: game.id, name: risk.name },
    });
    if (!existing) {
      await prisma.riskLevel.create({
        data: { ...risk, gameId: game.id },
      });
    }
  }

  // 4. Create 10 Financial & Knowledge Questions
  const seedQuestions = [
    {
      orderIndex: 1,
      category: 'Stock Markets',
      difficulty: 'Easy',
      questionText: 'What term describes a market condition where stock prices are continuously rising?',
      optionA: 'Bear Market',
      optionB: 'Bull Market',
      optionC: 'Stagflation',
      optionD: 'Short Squeeze',
      correctAnswer: 'B',
      explanation: 'A Bull Market refers to a period of time when stock prices are rising or expected to rise.',
      timerSeconds: 30,
    },
    {
      orderIndex: 2,
      category: 'Macroeconomics',
      difficulty: 'Medium',
      questionText: 'What central bank mechanism is used to control inflation by raising short-term interest rates?',
      optionA: 'Monetary Tightening',
      optionB: 'Quantitative Easing',
      optionC: 'Fiscal Stimulus',
      optionD: 'Yield Curve Control',
      correctAnswer: 'A',
      explanation: 'Monetary tightening (raising benchmark rates) reduces money supply to curb inflation.',
      timerSeconds: 30,
    },
    {
      orderIndex: 3,
      category: 'Corporate Finance',
      difficulty: 'Medium',
      questionText: 'What ratio measures a company’s valuation relative to its actual net annual income per share?',
      optionA: 'Debt-to-Equity Ratio',
      optionB: 'P/E (Price-to-Earnings) Ratio',
      optionC: 'Current Ratio',
      optionD: 'Return on Equity (ROE)',
      correctAnswer: 'B',
      explanation: 'The P/E Ratio measures current share price relative to its per-share earnings.',
      timerSeconds: 30,
    },
    {
      orderIndex: 4,
      category: 'Cryptocurrency & FinTech',
      difficulty: 'Hard',
      questionText: 'What is the maximum supply limit of Bitcoins that will ever exist in the protocol network?',
      optionA: '18 Million',
      optionB: '21 Million',
      optionC: '50 Million',
      optionD: 'Unlimited',
      correctAnswer: 'B',
      explanation: 'Satoshi Nakamoto hardcoded a maximum cap of 21,000,000 Bitcoins into the protocol.',
      timerSeconds: 30,
    },
    {
      orderIndex: 5,
      category: 'Investment Banking',
      difficulty: 'Medium',
      questionText: 'What is the initial public offering process where a private company sells stock to the public called?',
      optionA: 'IPO',
      optionB: 'SPAC',
      optionC: 'LBO',
      optionD: 'M&A',
      correctAnswer: 'A',
      explanation: 'IPO stands for Initial Public Offering.',
      timerSeconds: 30,
    },
    {
      orderIndex: 6,
      category: 'Indian Economy',
      difficulty: 'Hard',
      questionText: 'Which regulatory authority oversees equity markets and stock exchanges in India?',
      optionA: 'RBI',
      optionB: 'SEBI',
      optionC: 'IRDAI',
      optionD: 'NABARD',
      correctAnswer: 'B',
      explanation: 'SEBI (Securities and Exchange Board of India) regulates the Indian capital market.',
      timerSeconds: 30,
    },
    {
      orderIndex: 7,
      category: 'Global Markets',
      difficulty: 'Hard',
      questionText: 'What financial asset is traditionally considered the primary "Safe Haven" store of value during market volatility?',
      optionA: 'Tech Stocks',
      optionB: 'Gold',
      optionC: 'High-Yield Bonds',
      optionD: 'Crude Oil',
      correctAnswer: 'B',
      explanation: 'Gold is historically viewed as a safe haven asset to protect capital against inflation and crisis.',
      timerSeconds: 30,
    },
    {
      orderIndex: 8,
      category: 'Options & Derivatives',
      difficulty: 'Extreme',
      questionText: 'What financial derivative contract gives the holder the right, but NOT the obligation, to BUY an asset at a set price?',
      optionA: 'Put Option',
      optionB: 'Call Option',
      optionC: 'Futures Contract',
      optionD: 'Credit Default Swap',
      correctAnswer: 'B',
      explanation: 'A Call Option gives the buyer the right to buy an asset at the specified strike price.',
      timerSeconds: 30,
    },
    {
      orderIndex: 9,
      category: 'Venture Capital',
      difficulty: 'Hard',
      questionText: 'What term describes a privately held startup company valued at over $1 Billion?',
      optionA: 'Decacorn',
      optionB: 'Unicorn',
      optionC: 'Centaur',
      optionD: 'Angel Company',
      correctAnswer: 'B',
      explanation: 'Unicorn refers to a private startup company valued at $1 billion or more.',
      timerSeconds: 30,
    },
    {
      orderIndex: 10,
      category: 'Final Market Championship',
      difficulty: 'Extreme',
      questionText: 'Which famous investor coined the rule: "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1"?',
      optionA: 'Ray Dalio',
      optionB: 'Warren Buffett',
      optionC: 'Peter Lynch',
      optionD: 'George Soros',
      correctAnswer: 'B',
      explanation: 'Warren Buffett famous quote emphasizing capital preservation as the cornerstone of investing.',
      timerSeconds: 40,
    },
  ];

  for (const q of seedQuestions) {
    const existing = await prisma.question.findFirst({
      where: { gameId: game.id, orderIndex: q.orderIndex },
    });
    if (!existing) {
      await prisma.question.create({
        data: { ...q, gameId: game.id },
      });
    }
  }

  // 5. Create Demo Participants
  const demoPlayers = [
    { displayName: 'ALPHA TRADER', avatar: 'bull', currentCapital: 14500, totalProfit: 5000, totalLoss: 500 },
    { displayName: 'CYBER QUANT', avatar: 'fox', currentCapital: 12800, totalProfit: 3500, totalLoss: 700 },
    { displayName: 'PHOENIX CAPITAL', avatar: 'phoenix', currentCapital: 11200, totalProfit: 2200, totalLoss: 1000 },
    { displayName: 'TITAN VENTURES', avatar: 'lion', currentCapital: 9400, totalProfit: 1400, totalLoss: 2000 },
  ];

  for (const p of demoPlayers) {
    const existing = await prisma.participant.findFirst({
      where: { gameId: game.id, displayName: p.displayName },
    });
    if (!existing) {
      await prisma.participant.create({
        data: {
          gameId: game.id,
          displayName: p.displayName,
          avatar: p.avatar,
          startingCapital: 10000,
          currentCapital: p.currentCapital,
          availableCash: p.currentCapital,
          totalProfit: p.totalProfit,
          totalLoss: p.totalLoss,
          netPnL: p.currentCapital - 10000,
          returnPercentage: ((p.currentCapital - 10000) / 10000) * 100,
        },
      });
    }
  }

  console.log('✅ Seeding completed!');
  console.log(`📌 Demo Game PIN: 777888`);
  console.log(`📌 Admin Email: admin@knowledgeexchange.io`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
