'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATARS } from './AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { Trophy, Award, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ChampionData {
  rank: number;
  displayName: string;
  avatar: string;
  currentCapital: number;
  startingCapital: number;
  netPnL: number;
  returnPercentage: number;
  accuracy: number;
}

interface FinalRevealProps {
  rankings: ChampionData[];
  gameName: string;
}

export default function FinalReveal({ rankings, gameName }: FinalRevealProps) {
  const [step, setStep] = useState<number>(0);

  const thirdPlace = rankings[2];
  const secondPlace = rankings[1];
  const firstPlace = rankings[0];

  useEffect(() => {
    // Stage 1: 3rd place after 1s
    const t1 = setTimeout(() => setStep(1), 1000);
    // Stage 2: 2nd place after 3s
    const t2 = setTimeout(() => setStep(2), 3000);
    // Stage 3: Champion after 5s
    const t3 = setTimeout(() => {
      setStep(3);
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const getAvatar = (id?: string) => AVATARS.find((a) => a.id === id) || AVATARS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20 rounded-full blur-3xl opacity-40 pointer-events-none animate-pulse" />

      <div className="max-w-3xl w-full text-center z-10 space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-full">
            👑 MARKET CHAMPIONSHIP REVEAL
          </span>
          <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight mt-3">
            {gameName}
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">Final Market Settlement & Ranking Ceremony</p>
        </div>

        {/* Podium Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mt-8">
          {/* SECOND PLACE */}
          <div className="order-2 sm:order-1">
            <AnimatePresence>
              {step >= 2 && secondPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md"
                >
                  <div className="text-3xl mb-2">🥈</div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">2nd Place</span>
                  <div className={`w-14 h-14 mx-auto my-3 rounded-2xl bg-gradient-to-br ${getAvatar(secondPlace.avatar).color} flex items-center justify-center text-3xl shadow-lg ring-2 ring-slate-600`}>
                    {getAvatar(secondPlace.avatar).emoji}
                  </div>
                  <h3 className="font-mono text-lg font-bold text-white uppercase">{secondPlace.displayName}</h3>
                  <div className="text-base font-mono font-bold text-slate-300 mt-1">
                    {formatINR(secondPlace.currentCapital)}
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold block mt-0.5">
                    +{secondPlace.returnPercentage.toFixed(1)}% Return
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CHAMPION FIRST PLACE */}
          <div className="order-1 sm:order-2 sm:-translate-y-4">
            <AnimatePresence>
              {step >= 3 && firstPlace && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl shadow-amber-500/30 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 left-0 bg-amber-400/20 h-1 animate-pulse" />
                  <div className="text-5xl mb-2 animate-bounce">🏆</div>
                  <span className="text-xs font-mono uppercase font-bold text-amber-400 tracking-widest block">
                    MARKET CHAMPION
                  </span>
                  <div className={`w-20 h-20 mx-auto my-3 rounded-2xl bg-gradient-to-br ${getAvatar(firstPlace.avatar).color} flex items-center justify-center text-4xl shadow-xl ring-4 ring-amber-400/80`}>
                    {getAvatar(firstPlace.avatar).emoji}
                  </div>
                  <h2 className="font-mono text-2xl font-bold text-white uppercase tracking-wide">{firstPlace.displayName}</h2>
                  <div className="text-2xl font-mono font-bold text-amber-400 mt-2">
                    {formatINR(firstPlace.currentCapital)}
                  </div>
                  <div className="inline-block mt-2 px-3 py-1 bg-emerald-950 border border-emerald-500/40 rounded-full text-xs font-mono font-bold text-emerald-400">
                    Growth: +{firstPlace.returnPercentage.toFixed(1)}%
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* THIRD PLACE */}
          <div className="order-3">
            <AnimatePresence>
              {step >= 1 && thirdPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md"
                >
                  <div className="text-3xl mb-2">🥉</div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">3rd Place</span>
                  <div className={`w-14 h-14 mx-auto my-3 rounded-2xl bg-gradient-to-br ${getAvatar(thirdPlace.avatar).color} flex items-center justify-center text-3xl shadow-lg ring-2 ring-slate-700`}>
                    {getAvatar(thirdPlace.avatar).emoji}
                  </div>
                  <h3 className="font-mono text-lg font-bold text-white uppercase">{thirdPlace.displayName}</h3>
                  <div className="text-base font-mono font-bold text-slate-300 mt-1">
                    {formatINR(thirdPlace.currentCapital)}
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold block mt-0.5">
                    +{thirdPlace.returnPercentage.toFixed(1)}% Return
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" /> Enter Next Market Championship
          </Link>
        </div>
      </div>
    </div>
  );
}
