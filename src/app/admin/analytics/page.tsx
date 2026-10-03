'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatINR } from '@/lib/engines/portfolio-engine';
import { BarChart3, PieChart, Users, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') || '777888';

  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/analytics/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnalytics(data.analytics);
      })
      .catch(console.error);
  }, [gameId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar role="admin" />

      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-mono font-bold text-white uppercase">ANALYTICS & METRICS DASHBOARD</h1>
            <p className="text-xs font-mono text-slate-400">Capital exposure, risk distribution, and participant accuracy metrics.</p>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Total Participants</span>
              <div className="text-3xl font-mono font-bold text-white mt-1">{analytics.totalParticipants}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Total Portfolio Capital</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-1">{formatINR(analytics.totalCapital)}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Capital Exposure Ratio</span>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1">{analytics.exposureRatio}%</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono text-xs">Loading analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
