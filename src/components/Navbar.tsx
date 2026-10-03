'use client';

import Link from 'next/link';
import { TrendingUp, ShieldAlert, Tv, User, Trophy } from 'lucide-react';

interface NavbarProps {
  gamePin?: string;
  gameId?: string;
  role?: 'player' | 'admin' | 'arena';
  currentCapital?: number;
}

export default function Navbar({ gamePin, gameId, role = 'player', currentCapital }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-mono tracking-wider text-base font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-300 bg-clip-text text-transparent">
              KNOWLEDGE EXCHANGE
            </span>
            <span className="block text-[10px] tracking-widest text-slate-400 font-mono uppercase">
              Virtual Capital Terminal
            </span>
          </div>
        </Link>

        {/* Center / Game PIN info if active */}
        {gamePin && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-cyan-500/30 rounded-full">
            <span className="text-xs text-slate-400 font-mono">PIN:</span>
            <span className="text-sm font-mono font-bold text-cyan-400 tracking-wider">{gamePin}</span>
          </div>
        )}

        {/* Right Navigation */}
        <div className="flex items-center gap-2">
          {gameId && (
            <>
              <Link
                href={`/arena/${gameId}`}
                target="_blank"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                Arena
              </Link>
            </>
          )}

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
