'use client';

import { motion } from 'framer-motion';
import { AVATARS } from './AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { TrendingUp, Clock, Lock, CheckCircle, Trophy, Tv, Flame } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import MarketMoverCard from './MarketMoverCard';

interface ArenaDisplayProps {
  game: any;
  currentRound: any;
  activeQuestion: any;
  leaderboard: any[];
  summary?: any;
}

export default function ArenaDisplay({
  game,
  currentRound,
  activeQuestion,
  leaderboard,
  summary,
}: ArenaDisplayProps) {
  const getAvatar = (id?: string) => AVATARS.find((a) => a.id === id) || AVATARS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 flex flex-col justify-between select-none overflow-hidden relative">
      {/* Dynamic backdrop grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* TOP HEADER TICKER */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-500 p-0.5 shadow-xl shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-300 bg-clip-text text-transparent">
              KNOWLEDGE EXCHANGE
            </h1>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Live Virtual Capital Championship Arena
            </span>
          </div>
        </div>

        {/* Status Badge & Round info */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-mono text-slate-400 block uppercase">Current Market Round</span>
            <span className="font-mono text-xl font-bold text-cyan-400">
              ROUND {game?.currentRound?.toString().padStart(2, '0')} / {game?.totalRounds?.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm font-bold flex items-center gap-2">
            {game?.status === 'WAITING' && <span className="text-amber-400 animate-pulse">⏳ WAITING ROOM</span>}
            {game?.status === 'QUESTION_LIVE' && <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /> MARKET LIVE 🟢</span>}
            {game?.status === 'MARKET_LOCKED' && <span className="text-amber-400 flex items-center gap-1.5"><Lock className="w-4 h-4" /> MARKET LOCKED 🔒</span>}
            {game?.status === 'ANSWER_REVEAL' && <span className="text-cyan-400">💡 ANSWER REVEALED</span>}
            {game?.status === 'LEADERBOARD_UPDATE' && <span className="text-purple-400">📊 SETTLEMENT COMPLETE</span>}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto z-10 py-6">
        {/* LEFT / CENTER: QUESTION & MARKET OPPORTUNITY (Col 7) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          {activeQuestion ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 px-3 py-1 bg-cyan-950 border border-cyan-500/30 rounded-full">
                  {activeQuestion.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {activeQuestion.difficulty} Difficulty
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl font-bold text-white leading-snug tracking-tight mb-8">
                {activeQuestion.questionText}
              </h2>

              {/* OPTIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'A', text: activeQuestion.optionA },
                  { key: 'B', text: activeQuestion.optionB },
                  { key: 'C', text: activeQuestion.optionC },
                  { key: 'D', text: activeQuestion.optionD },
                ].map((opt) => {
                  const isCorrect = game?.status === 'ANSWER_REVEAL' && activeQuestion.correctAnswer === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                        isCorrect
                          ? 'bg-emerald-950 border-emerald-400 text-white shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400 scale-[1.02]'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl font-mono font-bold text-base flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <span className="text-base md:text-lg font-medium">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation if revealed */}
              {game?.status === 'ANSWER_REVEAL' && activeQuestion.explanation && (
                <div className="mt-6 p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-cyan-200 text-sm font-mono leading-relaxed">
                  💡 <strong>Analysis:</strong> {activeQuestion.explanation}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
              <h2 className="text-3xl font-mono font-bold text-slate-300">WAITING FOR NEXT MARKET OPPORTUNITY</h2>
              <p className="text-sm font-mono text-slate-500 mt-2">The Admin is preparing the next round question.</p>
            </div>
          )}

          {/* Market Movers banner */}
          {summary && (
            <MarketMoverCard biggestGainer={summary.biggestGainer} biggestLoser={summary.biggestLoser} />
          )}
        </div>

        {/* RIGHT: ARENA LEADERBOARD (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Market Leaderboard
              </h3>
              <span className="text-xs font-mono text-slate-400">Live Top 5</span>
            </div>

            <div className="space-y-3">
              {leaderboard.slice(0, 6).map((entry, idx) => {
                const av = getAvatar(entry.avatar);
                return (
                  <motion.div
                    key={entry.participantId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                      idx === 0
                        ? 'bg-amber-950/40 border-amber-400 text-white ring-1 ring-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-lg w-6 ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${av.color} flex items-center justify-center text-xl shadow-md`}>
                        {av.emoji}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm text-white uppercase">{entry.displayName}</div>
                        <div className="text-[10px] font-mono text-slate-400">Return: +{entry.returnPercentage.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-base text-white">{formatINR(entry.currentCapital)}</div>
                      <div className={`text-xs font-mono font-semibold ${entry.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(entry.netPnL, true)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER TICKER */}
      <footer className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono text-slate-500 z-10">
        <div>KNOWLEDGE EXCHANGE • TURN YOUR KNOWLEDGE INTO CAPITAL</div>
        <div>VIRTUAL CURRENCY SIMULATION • AUTHORITATIVE REALTIME ENGINE</div>
      </footer>
    </div>
  );
}
