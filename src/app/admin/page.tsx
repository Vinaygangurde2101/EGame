'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { ShieldAlert, Plus, Play, Tv, FileText, BarChart3, Clock, Users, RefreshCw } from 'lucide-react';

export default function AdminOverviewPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Game modal form state
  const [newGameName, setNewGameName] = useState('Global Financial Championship');
  const [startingCapital, setStartingCapital] = useState(10000);
  const [totalRounds, setTotalRounds] = useState(10);
  const [creating, setCreating] = useState(false);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/games');
      const data = await res.json();
      if (data.success && data.games) {
        setGames(data.games);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGameName,
          startingCapital,
          totalRounds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchGames();
        window.location.href = `/admin/games/${data.game.id}`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar role="admin" />

      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-xs font-mono font-bold text-cyan-300 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Admin Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              GAME MANAGEMENT & CONTROL
            </h1>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchGames}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition"
              title="Refresh Games"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
            <Link
              href="/admin/questions?gameId=777888"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4 text-cyan-400" /> Question Pool
            </Link>
            <Link
              href="/admin/analytics?gameId=777888"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Analytics
            </Link>
          </div>
        </div>

        {/* CREATE GAME FORM */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="font-mono text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" /> Create New Championship Game
          </h2>

          <form onSubmit={handleCreateGame} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Game Name</label>
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Starting Capital (₹)</label>
              <input
                type="number"
                value={startingCapital}
                onChange={(e) => setStartingCapital(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {creating ? 'CREATING...' : 'CREATE & LAUNCH GAME'}
              </button>
            </div>
          </form>
        </div>

        {/* ACTIVE GAMES LIST */}
        <div className="space-y-4">
          <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Configured Games ({games.length})</span>
            {loading && <span className="text-xs text-cyan-400 animate-pulse">Loading games...</span>}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 px-2.5 py-0.5 bg-cyan-950 border border-cyan-500/30 rounded-full">
                      PIN: {g.gamePin}
                    </span>
                    <h3 className="font-mono text-lg font-bold text-white mt-2">{g.name}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {g.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Capital</span>
                    <span className="font-bold text-white">{formatINR(g.startingCapital)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Round</span>
                    <span className="font-bold text-cyan-400">R{g.currentRound}/{g.totalRounds}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Players</span>
                    <span className="font-bold text-emerald-400">{g._count?.participants || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Questions</span>
                    <span className="font-bold text-amber-400">{g._count?.questions || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/games/${g.id}`}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-xl text-center shadow-md flex items-center justify-center gap-1.5 transition"
                  >
                    <Play className="w-4 h-4 fill-slate-950" /> CONTROL ROOM
                  </Link>

                  <Link
                    href={`/admin/questions?gameId=${g.id}`}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 border border-slate-700 transition"
                    title="Edit Questions"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </Link>

                  <Link
                    href={`/arena/${g.id}`}
                    target="_blank"
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 border border-slate-700 transition"
                    title="Arena Display"
                  >
                    <Tv className="w-4 h-4 text-emerald-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs font-mono text-slate-500 border-t border-slate-900">
        KNOWLEDGE EXCHANGE ADMIN DASHBOARD
      </footer>
    </div>
  );
}

