'use client';

import { motion } from 'framer-motion';
import { AVATARS } from './AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { ArrowUp, ArrowDown, Minus, Trophy, Flame, Shield, Award } from 'lucide-react';

export interface LeaderboardItem {
  rank: number;
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

interface LeaderboardProps {
  entries: LeaderboardItem[];
  currentParticipantId?: string;
  compact?: boolean;
}

export default function Leaderboard({ entries, currentParticipantId, compact = false }: LeaderboardProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 font-mono text-sm">
        No market participants registered yet.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Live Market Leaderboard
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Realtime P&L Ranking</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const avatarObj = AVATARS.find((a) => a.id === entry.avatar) || AVATARS[0];
          const isCurrent = entry.participantId === currentParticipantId;
          const isTop3 = entry.rank <= 3;

          return (
            <motion.div
              key={entry.participantId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400/60'
                  : isTop3
                  ? 'bg-slate-950/80 border-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800/80'
              }`}
            >
              {/* Rank & Movement */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 min-w-[32px]">
                  <span
                    className={`font-mono font-bold text-sm ${
                      entry.rank === 1
                        ? 'text-amber-400'
                        : entry.rank === 2
                        ? 'text-slate-300'
                        : entry.rank === 3
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {entry.rank.toString().padStart(2, '0')}
                  </span>

                  {entry.rankMovement === 'UP' ? (
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : entry.rankMovement === 'DOWN' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarObj.color} flex items-center justify-center text-base shadow-sm shrink-0`}
                  >
                    {avatarObj.emoji}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      {entry.displayName}
                      {entry.streakCount >= 3 && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title="Hot Streak">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> {entry.streakCount}
                        </span>
                      )}
                    </div>
                    {!compact && (
                      <div className="text-[10px] font-mono text-slate-400">
                        Accuracy: {entry.accuracy}% | Badges: {entry.achievementsCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Portfolio & PnL */}
              <div className="text-right">
                <div className="text-xs sm:text-sm font-mono font-bold text-white">
                  {formatINR(entry.currentCapital)}
                </div>
                <div
                  className={`text-[11px] font-mono font-semibold ${
                    entry.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatINR(entry.netPnL, true)} ({entry.returnPercentage >= 0 ? `+${entry.returnPercentage.toFixed(1)}%` : `${entry.returnPercentage.toFixed(1)}%`})
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
