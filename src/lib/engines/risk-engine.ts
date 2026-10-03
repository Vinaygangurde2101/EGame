export interface RiskDefinition {
  id: string;
  name: string; // LOW, MEDIUM, HIGH, EXTREME
  exposurePercentage: number;
  winningReturn: number;
  losingRate: number;
  color?: string;
}

export const DEFAULT_RISK_LEVELS: Omit<RiskDefinition, 'id'>[] = [
  {
    name: 'LOW',
    exposurePercentage: 0.10,
    winningReturn: 0.10,
    losingRate: 0.05,
    color: 'emerald',
  },
  {
    name: 'MEDIUM',
    exposurePercentage: 0.25,
    winningReturn: 0.25,
    losingRate: 0.15,
    color: 'cyan',
  },
  {
    name: 'HIGH',
    exposurePercentage: 0.50,
    winningReturn: 0.50,
    losingRate: 0.35,
    color: 'amber',
  },
  {
    name: 'EXTREME',
    exposurePercentage: 0.75,
    winningReturn: 1.00,
    losingRate: 0.75,
    color: 'rose',
  },
];

export interface CalculatedExposure {
  exposedCapital: number;
  potentialWin: number;
  potentialLoss: number;
}

export function calculateRiskExposure(
  currentCapital: number,
  riskLevel: { exposurePercentage: number; winningReturn: number; losingRate: number },
  multiplier: number = 1.0
): CalculatedExposure {
  const exposedCapital = Math.max(0, Math.round(currentCapital * riskLevel.exposurePercentage));
  const potentialWin = Math.round(exposedCapital * riskLevel.winningReturn * multiplier);
  const potentialLoss = Math.round(exposedCapital * riskLevel.losingRate);

  return {
    exposedCapital,
    potentialWin,
    potentialLoss,
  };
}
