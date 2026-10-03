'use client';

import { formatINR } from '@/lib/engines/portfolio-engine';
import { Lock, ShieldCheck, Zap, Flame, Skull, Clock } from 'lucide-react';

interface LockedPositionCardProps {
  selectedAnswer: string;
  riskName: string;
  exposedCapital: number;
  potentialWin: number;
  potentialLoss: number;
  submittedAt?: string | Date;
}

const RISK_ICONS: Record<string, any> = {
  LOW: ShieldCheck,
  MEDIUM: Zap,
  HIGH: Flame,
  EXTREME: Skull,
};

export default function LockedPositionCard({
  selectedAnswer,
  riskName,
  exposedCapital,
  potentialWin,
  potentialLoss,
  submittedAt,
}: LockedPositionCardProps) {
  const IconComp = RISK_ICONS[riskName] || Zap;

  return (
    <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden text-center">
      {/* Glow pulse */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Lock Icon Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-cyan-300 font-mono text-xs font-bold tracking-wider mb-4 animate-pulse">
        <Lock className="w-3.5 h-3.5" /> POSITION LOCKED 🔒
      </div>

      <h3 className="text-xl font-mono font-bold text-white mb-1">Position Committed to Market</h3>
      <p className="text-xs text-slate-400 font-mono mb-4">You cannot modify this position for Round settlement.</p>

      {/* Grid Summary */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-left">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Selected Option</span>
          <span className="text-lg font-mono font-bold text-cyan-400">Option {selectedAnswer}</span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Risk Profile</span>
          <div className="flex items-center gap-1 mt-1">
            <IconComp className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-mono font-bold text-white">{riskName}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Capital Exposed</span>
          <span className="text-sm font-mono font-bold text-amber-400 mt-1 block">{formatINR(exposedCapital)}</span>
        </div>
      </div>

      {/* Expected Outcome Explanation */}
      <div className="mt-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px]">If Prediction Correct:</span>
          <span className="text-emerald-400 font-bold">+{formatINR(potentialWin)} Profit</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[10px]">If Prediction Incorrect:</span>
          <span className="text-rose-400 font-bold">-{formatINR(potentialLoss)} Loss</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Waiting for Market Close & Settlement...
      </div>
    </div>
  );
}
