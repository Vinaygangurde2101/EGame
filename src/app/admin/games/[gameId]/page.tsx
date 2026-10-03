'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Navbar from '@/components/Navbar';
import AdminGuard from '@/components/AdminGuard';
import { formatINR } from '@/lib/engines/portfolio-engine';
import {
  ShieldAlert,
  Play,
  Lock,
  Eye,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Tv,
  Users,
  Wallet,
  PieChart,
  BarChart3,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export default function AdminControlRoomPage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;

  const [gameState, setGameState] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchState = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}`);
      const data = await res.json();

      if (data.success) {
        setGameState(data.game);
        setCurrentRound(data.currentRound);
        setActiveQuestion(data.activeQuestion);
        setLeaderboard(data.leaderboard || []);
      }

      // Fetch analytics
      const analyticsRes = await fetch(`/api/admin/analytics/${gameId}`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchState();

    const socket = io({ transports: ['websocket', 'polling'] });
    socket.emit('join_game', { gameId, role: 'admin' });

    socket.on('game_state_changed', (payload) => {
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status, currentRound: payload.currentRound ?? prev.currentRound } : prev);
      }
      fetchState();
    });

    socket.on('round_started', (payload) => {
      if (payload?.currentRound) setCurrentRound(payload.currentRound);
      if (payload?.activeQuestion) setActiveQuestion(payload.activeQuestion);
      if (payload?.status) setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      fetchState();
    });

    socket.on('market_locked', (payload) => {
      if (payload?.status) setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      fetchState();
    });

    socket.on('answer_revealed', (payload) => {
      if (payload?.status) setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      fetchState();
    });

    socket.on('settlement_completed', (payload) => {
      if (payload?.status) setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      if (payload?.leaderboard) setLeaderboard(payload.leaderboard);
      fetchState();
    });

    socket.on('player_joined', () => fetchState());
    socket.on('position_submitted', () => fetchState());

    return () => {
      socket.disconnect();
    };
  }, [gameId]);

  // Admin Actions with Instant Optimistic UI Feedback
  const handleStartRound = async () => {
    setLoading(true);
    setActionMessage('Advancing to next round...');
    try {
      const res = await fetch('/api/admin/round/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        if (data.result.round) setCurrentRound(data.result.round);
        if (data.result.question) setActiveQuestion(data.result.question);
        setGameState((prev: any) => prev ? { ...prev, status: 'ROUND_START', currentRound: data.result.round?.roundNumber || prev.currentRound } : prev);
      }
      await fetchState();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
      setActionMessage('');
    }
  };

  const handleLockMarket = async () => {
    if (!currentRound) return;
    setLoading(true);
    try {
      setGameState((prev: any) => prev ? { ...prev, status: 'MARKET_LOCKED' } : prev);
      await fetch('/api/admin/round/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, roundId: currentRound.id }),
      });
      await fetchState();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    if (!currentRound) return;
    setLoading(true);
    try {
      setGameState((prev: any) => prev ? { ...prev, status: 'ANSWER_REVEAL' } : prev);
      await fetch('/api/admin/round/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, roundId: currentRound.id }),
      });
      await fetchState();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleRound = async () => {
    if (!currentRound) return;
    setLoading(true);
    try {
      setGameState((prev: any) => prev ? { ...prev, status: 'LEADERBOARD_UPDATE' } : prev);
      const res = await fetch('/api/admin/round/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, roundId: currentRound.id }),
      });
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      await fetchState();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteGame = async () => {
    if (!window.confirm(`Are you sure you want to delete "${gameState?.name || 'this game'}"? All player positions and trade history will be permanently deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games?gameId=${gameId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/admin';
      } else {
        alert(data.error || 'Failed to delete game');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navbar gamePin={gameState?.gamePin} gameId={gameId} role="admin" />

        <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
          {/* STATS HEADER BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Game Status</span>
              <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">{gameState?.status || 'LOADING'}</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Current Round</span>
              <span className="text-sm font-mono font-bold text-cyan-400 mt-0.5 block">
                Round {gameState?.currentRound?.toString().padStart(2, '0')} / {gameState?.totalRounds?.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Traders Connected</span>
              <span className="text-sm font-mono font-bold text-white mt-0.5 block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> {analytics?.totalParticipants || 0}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Capital</span>
              <span className="text-sm font-mono font-bold text-slate-200 mt-0.5 block">
                {formatINR(analytics?.totalCapital || 0)}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Capital Exposed</span>
              <span className="text-sm font-mono font-bold text-amber-400 mt-0.5 block">
                {formatINR(analytics?.capitalExposed || 0)}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Exposure Ratio</span>
              <span className="text-sm font-mono font-bold text-cyan-400 mt-0.5 block">
                {analytics?.exposureRatio || 0}%
              </span>
            </div>
          </div>

          {/* ADMIN ACTION CONTROL BAR */}
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" /> Authoritative Market Action Bar
              </h2>
              {actionMessage && <span className="text-xs font-mono text-amber-400 animate-pulse">{actionMessage}</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleStartRound}
                className="py-3 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-slate-950" /> 1. START ROUND
              </button>

              <button
                type="button"
                disabled={loading || !currentRound}
                onClick={handleLockMarket}
                className="py-3 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Lock className="w-4 h-4" /> 2. CLOSE MARKET
              </button>

              <button
                type="button"
                disabled={loading || !currentRound}
                onClick={handleRevealAnswer}
                className="py-3 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Eye className="w-4 h-4" /> 3. REVEAL ANSWER
              </button>

              <button
                type="button"
                disabled={loading || !currentRound}
                onClick={handleSettleRound}
                className="py-3 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> 4. SETTLE ROUND
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleStartRound}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <ArrowRight className="w-4 h-4 text-cyan-400" /> NEXT ROUND
              </button>

              <a
                href={`/arena/${gameId}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Tv className="w-4 h-4" /> ARENA TV
              </a>

              <button
                type="button"
                onClick={handleDeleteGame}
                className="py-3 px-3 bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                title="Delete this championship game"
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> DELETE GAME
              </button>
            </div>
          </div>

        {/* ACTIVE QUESTION & ANALYTICS BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Question Preview (Col 7) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Active Question • Round {gameState?.currentRound}
              </span>
              {activeQuestion && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Correct Answer: {activeQuestion.correctAnswer}
                </span>
              )}
            </div>

            {activeQuestion ? (
              <div className="space-y-4">
                <h3 className="text-lg font-mono font-bold text-white leading-relaxed">
                  {activeQuestion.questionText}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className={`p-2.5 rounded-xl border ${activeQuestion.correctAnswer === 'A' ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    Option A: {activeQuestion.optionA}
                  </div>
                  <div className={`p-2.5 rounded-xl border ${activeQuestion.correctAnswer === 'B' ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    Option B: {activeQuestion.optionB}
                  </div>
                  <div className={`p-2.5 rounded-xl border ${activeQuestion.correctAnswer === 'C' ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    Option C: {activeQuestion.optionC}
                  </div>
                  <div className={`p-2.5 rounded-xl border ${activeQuestion.correctAnswer === 'D' ? 'bg-emerald-950 border-emerald-400 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    Option D: {activeQuestion.optionD}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                No active question loaded for this round.
              </div>
            )}
          </div>

          {/* Realtime Answer & Risk Analytics (Col 5) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" /> Realtime Position Analytics
            </h3>

            {/* Answer Distribution */}
            {analytics && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Answer Distribution</span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <span className="text-xs text-slate-400 block">A</span>
                    <span className="text-sm font-bold text-cyan-400">{analytics.answerDistribution?.A || 0}%</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <span className="text-xs text-slate-400 block">B</span>
                    <span className="text-sm font-bold text-cyan-400">{analytics.answerDistribution?.B || 0}%</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <span className="text-xs text-slate-400 block">C</span>
                    <span className="text-sm font-bold text-cyan-400">{analytics.answerDistribution?.C || 0}%</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                    <span className="text-xs text-slate-400 block">D</span>
                    <span className="text-sm font-bold text-cyan-400">{analytics.answerDistribution?.D || 0}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Level Exposure Distribution */}
            {analytics && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Risk Level Breakdown</span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2">
                    <span className="text-emerald-400 block font-bold">LOW</span>
                    <span className="text-white font-bold">{analytics.riskCounts?.LOW || 0}</span>
                  </div>
                  <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-2">
                    <span className="text-cyan-400 block font-bold">MED</span>
                    <span className="text-white font-bold">{analytics.riskCounts?.MEDIUM || 0}</span>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2">
                    <span className="text-amber-400 block font-bold">HIGH</span>
                    <span className="text-white font-bold">{analytics.riskCounts?.HIGH || 0}</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2">
                    <span className="text-rose-400 block font-bold">EXT</span>
                    <span className="text-white font-bold">{analytics.riskCounts?.EXTREME || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  </AdminGuard>
);
}
