'use client';

import { AVATARS } from './AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { TrendingUp, TrendingDown, Zap, Award } from 'lucide-react';

interface MarketMoverCardProps {
  biggestGainer?: { name: string; avatar: string; amount: number };
  biggestLoser?: { name: string; avatar: string; amount: number };
}

export default function MarketMoverCard({ biggestGainer, biggestLoser }: MarketMoverCardProps) {
  if (!biggestGainer && !biggestLoser) return null;

  const gainerAvatar = biggestGainer ? AVATARS.find((a) => a.id === biggestGainer.avatar) || AVATARS[0] : null;
  const loserAvatar = biggestLoser ? AVATARS.find((a) => a.id === biggestLoser.avatar) || AVATARS[0] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {biggestGainer && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gainerAvatar?.color} flex items-center justify-center text-xl shadow-md`}>
              {gainerAvatar?.emoji}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Biggest Gainer
              </span>
              <h4 className="font-mono text-sm font-bold text-white uppercase">{biggestGainer.name}</h4>
            </div>
          </div>
          <div className="text-right font-mono font-bold text-emerald-400 text-sm sm:text-base">
            +{formatINR(biggestGainer.amount)}
          </div>
        </div>
      )}

      {biggestLoser && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${loserAvatar?.color} flex items-center justify-center text-xl shadow-md`}>
              {loserAvatar?.emoji}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Biggest Drop
              </span>
              <h4 className="font-mono text-sm font-bold text-white uppercase">{biggestLoser.name}</h4>
            </div>
          </div>
          <div className="text-right font-mono font-bold text-rose-400 text-sm sm:text-base">
            {formatINR(biggestLoser.amount)}
          </div>
        </div>
      )}
    </div>
  );
}
