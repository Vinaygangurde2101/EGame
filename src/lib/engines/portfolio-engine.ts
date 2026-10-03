export interface PortfolioMetrics {
  startingCapital: number;
  currentCapital: number;
  availableCash: number;
  exposedCapital: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  returnPercentage: number;
}

export function calculatePortfolioMetrics(
  startingCapital: number,
  currentCapital: number,
  totalProfit: number,
  totalLoss: number,
  exposedCapital: number = 0
): PortfolioMetrics {
  const netPnL = currentCapital - startingCapital;
  const returnPercentage = startingCapital > 0 ? (netPnL / startingCapital) * 100 : 0;
  const availableCash = Math.max(0, currentCapital - exposedCapital);

  return {
    startingCapital,
    currentCapital,
    availableCash,
    exposedCapital,
    totalProfit,
    totalLoss,
    netPnL,
    returnPercentage: parseFloat(returnPercentage.toFixed(2)),
  };
}

export function formatINR(amount: number, includeSign: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `- ${formatted}`;
  }
  if (amount > 0 && includeSign) {
    return `+ ${formatted}`;
  }
  return formatted;
}
