'use client';

import { AVATARS } from './AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { Wallet, TrendingUp, TrendingDown, Lock, PieChart, ShieldAlert } from 'lucide-react';

interface PortfolioCardProps {
  displayName: string;
  avatar: string;
  currentCapital: number;
  availableCash: number;
  exposedCapital: number;
  netPnL: number;
  returnPercentage: number;
  currentRound?: number;
  totalRounds?: number;
  riskName?: string;
  compact?: boolean;
}

export default function PortfolioCard({
  displayName,
  avatar,
  currentCapital,
  availableCash,
  exposedCapital,
  netPnL,
  returnPercentage,
  currentRound = 1,
  totalRounds = 10,
  riskName,
  compact = false,
}: PortfolioCardProps) {
  const avatarObj = AVATARS.find((a) => a.id === avatar) || AVATARS[0];
  const isPositive = netPnL >= 0;

  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarObj.color} flex items-center justify-center text-lg shadow-sm`}>
            {avatarObj.emoji}
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">{displayName}</div>
            <div className="text-base font-mono font-bold text-white">{formatINR(currentCapital)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatINR(netPnL, true)}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {returnPercentage >= 0 ? `+${returnPercentage.toFixed(1)}%` : `${returnPercentage.toFixed(1)}%`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Background glow accent */}
      <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      {/* Header info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarObj.color} flex items-center justify-center text-2xl shadow-md ring-2 ring-slate-800`}>
            {avatarObj.emoji}
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-white tracking-wide uppercase">{displayName}</h3>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Round {currentRound.toString().padStart(2, '0')} / {totalRounds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {riskName && (
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Risk Exposure</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
              {riskName}
            </span>
          </div>
        )}
      </div>

      {/* Main Portfolio Value */}
      <div className="my-4">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Total Portfolio Value
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {formatINR(currentCapital)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-mono font-bold px-2.5 py-1 rounded-lg ${isPositive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatINR(netPnL, true)} ({returnPercentage >= 0 ? `+${returnPercentage.toFixed(1)}%` : `${returnPercentage.toFixed(1)}%`})
          </div>
        </div>
      </div>

      {/* Sub metrics grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <PieChart className="w-3 h-3 text-emerald-400" /> Available Cash
          </div>
          <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
            {formatINR(availableCash)}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" /> Exposed Capital
          </div>
          <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
            {formatINR(exposedCapital)}
          </div>
        </div>
      </div>
    </div>
  );
}
