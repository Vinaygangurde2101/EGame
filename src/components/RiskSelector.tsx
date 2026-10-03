'use client';

import { formatINR } from '@/lib/engines/portfolio-engine';
import { calculateRiskExposure } from '@/lib/engines/risk-engine';
import { Zap, ShieldCheck, Flame, Skull } from 'lucide-react';

interface RiskLevelData {
  id: string;
  name: string;
  exposurePercentage: number;
  winningReturn: number;
  losingRate: number;
  color?: string;
}

interface RiskSelectorProps {
  riskLevels: RiskLevelData[];
  selectedRiskId: string;
  onSelect: (riskLevel: RiskLevelData) => void;
  currentCapital: number;
  multiplier?: number;
  disabled?: boolean;
}

const RISK_ICONS: Record<string, any> = {
  LOW: ShieldCheck,
  MEDIUM: Zap,
  HIGH: Flame,
  EXTREME: Skull,
};

const RISK_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  LOW: {
    border: 'border-emerald-500/50 hover:border-emerald-400',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-950 border-emerald-500/30 text-emerald-300',
  },
  MEDIUM: {
    border: 'border-cyan-500/50 hover:border-cyan-400',
    bg: 'bg-cyan-950/20',
    text: 'text-cyan-400',
    badge: 'bg-cyan-950 border-cyan-500/30 text-cyan-300',
  },
  HIGH: {
    border: 'border-amber-500/50 hover:border-amber-400',
    bg: 'bg-amber-950/20',
    text: 'text-amber-400',
    badge: 'bg-amber-950 border-amber-500/30 text-amber-300',
  },
  EXTREME: {
    border: 'border-rose-500/50 hover:border-rose-400',
    bg: 'bg-rose-950/20',
    text: 'text-rose-400',
    badge: 'bg-rose-950 border-rose-500/30 text-rose-300',
  },
};

export default function RiskSelector({
  riskLevels,
  selectedRiskId,
  onSelect,
  currentCapital,
  multiplier = 1.0,
  disabled = false,
}: RiskSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-cyan-400" /> Select Risk & Capital Exposure
        </label>
        {multiplier > 1.0 && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/40 rounded-full animate-pulse">
            ⚡ {multiplier}x Payout Multiplier
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {riskLevels.map((risk) => {
          const isSelected = selectedRiskId === risk.id;
          const IconComponent = RISK_ICONS[risk.name] || Zap;
          const style = RISK_STYLES[risk.name] || RISK_STYLES.MEDIUM;

          const { exposedCapital, potentialWin, potentialLoss } = calculateRiskExposure(
            currentCapital,
            risk,
            multiplier
          );

          return (
            <button
              key={risk.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(risk)}
              className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? `bg-slate-900 ${style.border} ring-2 ring-cyan-400/80 shadow-lg scale-[1.02]`
                  : `bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/50 opacity-90 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-1.5">
                  <IconComponent className={`w-4 h-4 ${style.text}`} />
                  <span className={`font-mono text-xs font-bold ${style.text}`}>{risk.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${style.badge}`}>
                  {(risk.exposurePercentage * 100).toFixed(0)}% Exp
                </span>
              </div>

              {/* Exposure Rupee amount */}
              <div className="my-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Exposed</span>
                <span className="text-sm font-mono font-bold text-white">{formatINR(exposedCapital)}</span>
              </div>

              {/* Win / Loss estimates */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[11px] font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Win</span>
                  <span className="text-emerald-400 font-bold">+{formatINR(potentialWin)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block uppercase">Loss</span>
                  <span className="text-rose-400 font-bold">-{formatINR(potentialLoss)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
