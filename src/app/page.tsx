'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import Navbar from '@/components/Navbar';
import PortfolioCard from '@/components/PortfolioCard';
import QuestionCard from '@/components/QuestionCard';
import RiskSelector from '@/components/RiskSelector';
import LockedPositionCard from '@/components/LockedPositionCard';
import CountdownTimer from '@/components/CountdownTimer';
import Leaderboard from '@/components/Leaderboard';
import AchievementBadge from '@/components/AchievementBadge';
import FinalReveal from '@/components/FinalReveal';
import AvatarPicker from '@/components/AvatarPicker';
import { formatINR } from '@/lib/engines/portfolio-engine';
import {
  TrendingUp,
  Wallet,
  Trophy,
  History,
  Award,
  Lock,
  ArrowRight,
  Sparkles,
  Play,
  Smartphone,
  Layers,
  Zap,
  CheckCircle,
  RefreshCw,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export default function SinglePageMobileTerminal() {
  const router = useRouter();

  // Mode & Tab states
  const [viewMode, setViewMode] = useState<'continuous' | 'tabs'>('continuous');
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'leaderboard' | 'history' | 'achievements'>('market');

  // Join form states
  const [gamePin, setGamePin] = useState('777888');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('bull');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Active session state
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Live game data
  const [gameState, setGameState] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [riskLevels, setRiskLevels] = useState<any[]>([]);
  const [participant, setParticipant] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Selection states
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | ''>('');
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Trigger tactile vibration on mobile devices
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Fallback silently if vibration API unsupported
      }
    }
  };

  // 1. Auto-resume saved game session on load
  useEffect(() => {
    const savedGameId = localStorage.getItem('last_game_id');
    if (savedGameId) {
      const pid = localStorage.getItem(`participant_${savedGameId}`);
      if (pid) {
        setActiveGameId(savedGameId);
        setParticipantId(pid);
      }
    }
  }, []);

  // 2. Fetch authoritative state from server
  const fetchState = async (gid = activeGameId, pid = participantId) => {
    if (!gid) return;
    try {
      const url = pid
        ? `/api/game/${gid}?participantId=${pid}`
        : `/api/game/${gid}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setGameState(data.game);
        setCurrentRound(data.currentRound);
        setActiveQuestion(data.activeQuestion);
        setRiskLevels(data.riskLevels);
        setParticipant(data.participant);
        setCurrentPosition(data.currentPosition);
        setHistory(data.history || []);
        setLeaderboard(data.leaderboard || []);

        if (data.riskLevels && data.riskLevels.length > 0 && !selectedRisk) {
          const med = data.riskLevels.find((r: any) => r.name === 'MEDIUM') || data.riskLevels[0];
          setSelectedRisk(med);
        }
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  };

  useEffect(() => {
    if (activeGameId) {
      fetchState();
    }
  }, [activeGameId, participantId]);

  // 3. Realtime Socket listener
  useEffect(() => {
    if (!activeGameId) return;

    const socket = io();

    socket.emit('join_game', {
      gameId: activeGameId,
      participantId: participantId || undefined,
      role: 'player',
    });

    socket.on('game_state_changed', () => fetchState());
    socket.on('round_started', () => {
      setSelectedOption('');
      fetchState();
    });
    socket.on('market_locked', () => fetchState());
    socket.on('answer_revealed', () => fetchState());
    socket.on('settlement_completed', () => fetchState());

    return () => {
      socket.disconnect();
    };
  }, [activeGameId, participantId]);

  // Handle Game Join
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);
    setJoinError('');

    if (!gamePin.trim()) {
      setJoinError('Please enter a valid Game PIN.');
      return;
    }
    if (!displayName.trim()) {
      setJoinError('Please enter your Trader Name.');
      return;
    }

    setJoining(true);

    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamePin, displayName, avatar }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to join game.');
      }

      localStorage.setItem(`participant_${data.gameId}`, data.participant.id);
      localStorage.setItem('last_game_id', data.gameId);

      setActiveGameId(data.gameId);
      setParticipantId(data.participant.id);
      await fetchState(data.gameId, data.participant.id);
      triggerHaptic([30, 50, 30]);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  // Handle Quick Demo Auto-fill & Join
  const handleQuickDemoJoin = () => {
    triggerHaptic(15);
    const demoPin = '777888';
    const demoName = `TRADER_${Math.floor(100 + Math.random() * 900)}`;
    setGamePin(demoPin);
    setDisplayName(demoName);
  };

  const handleAutoLock = async () => {
    if (activeGameId && currentRound && (gameState?.status === 'ROUND_START' || gameState?.status === 'QUESTION_LIVE' || gameState?.status === 'POSITION_SUBMISSION')) {
      try {
        await fetch('/api/admin/round/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: activeGameId, roundId: currentRound.id }),
        });
        await fetchState();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle Position Submission
  const handleSubmitPosition = async () => {
    if (!selectedOption) {
      setErrorMessage('Please select an option (A, B, C, or D).');
      return;
    }
    if (!selectedRisk) {
      setErrorMessage('Please select a risk exposure level.');
      return;
    }
    if (!participantId || !currentRound) return;

    triggerHaptic([40, 60]);
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/game/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          roundId: currentRound.id,
          selectedAnswer: selectedOption,
          riskLevelId: selectedRisk.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to lock position.');
      }

      await fetchState();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentRank = leaderboard.find((item) => item.participantId === participantId)?.rank || '-';

  if (gameState?.status === 'GAME_FINISHED') {
    return <FinalReveal rankings={leaderboard} gameName={gameState?.name || 'Knowledge Exchange'} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-28 sm:pb-8">
      <Navbar gamePin={gameState?.gamePin || gamePin} gameId={activeGameId || undefined} currentCapital={participant?.currentCapital} />

      {/* STAGE 1: ENTRY / JOIN CARD (IF NO ACTIVE GAME TERMINAL SESSION) */}
      {!activeGameId && (
        <main className="max-w-md w-full mx-auto px-4 py-6 sm:py-10 flex-1 flex flex-col justify-center">
          {/* HERO HEADER */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-cyan-950/90 border border-cyan-500/40 rounded-full text-xs font-mono font-bold text-cyan-300 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Mobile One-Page Market Terminal
            </div>

            <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white leading-tight">
              TURN KNOWLEDGE INTO VIRTUAL CAPITAL.
            </h1>

            <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-sm mx-auto leading-relaxed">
              Real-time mobile trading terminal. Predict correctly, set your risk leverage, and dominate the championship.
            </p>
          </div>

          {/* JOIN FORM CARD */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500" />

            <form onSubmit={handleJoinGame} className="space-y-4">
              {joinError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-xs text-center animate-shake">
                  ⚠️ {joinError}
                </div>
              )}

              {/* Game PIN Input */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Game PIN</span>
                  <span className="text-[10px] text-cyan-400 font-normal">6-Digit Code</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={gamePin}
                  onChange={(e) => setGamePin(e.target.value)}
                  placeholder="777888"
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 rounded-2xl px-4 py-3 text-cyan-400 placeholder:text-slate-600 outline-none uppercase transition-all"
                />
              </div>

              {/* Trader Display Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Trader / Player Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. QUANT_RIDER"
                  maxLength={20}
                  className="w-full font-mono text-sm font-semibold bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>

              {/* Avatar Picker */}
              <AvatarPicker selected={avatar} onSelect={(a) => { triggerHaptic(10); setAvatar(a); }} />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-base rounded-2xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" /> LAUNCHING TERMINAL...
                  </span>
                ) : (
                  <>
                    ENTER MARKET TERMINAL <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* DEMO MODE DIRECT SHORTCUT */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleQuickDemoJoin}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mx-auto bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" /> Auto-fill Demo Credentials (777888)
              </button>
            </div>
          </div>
        </main>
      )}

      {/* STAGE 2: LIVE ONE-PAGE MOBILE TERMINAL */}
      {activeGameId && (
        <main className="max-w-xl w-full mx-auto px-4 py-3 flex-1 space-y-4">
          {/* MOBILE HEADS-UP DISPLAY (HUD BANNER) */}
          {participant && (
            <div className="sticky top-14 z-40 bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-xs font-bold shadow-inner">
                  #{currentRank}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>{participant.displayName}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="text-base font-mono font-bold text-white leading-tight">
                    {formatINR(participant.currentCapital)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${participant.netPnL >= 0 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-rose-950 text-rose-400 border-rose-500/30'}`}>
                  {participant.returnPercentage >= 0 ? `+${participant.returnPercentage.toFixed(1)}%` : `${participant.returnPercentage.toFixed(1)}%`}
                </div>

                {/* Mobile View Mode Switcher Pill */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setViewMode(viewMode === 'continuous' ? 'tabs' : 'continuous');
                  }}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-[10px] font-mono font-bold text-cyan-300 hover:border-cyan-400 flex items-center gap-1 transition"
                  title="Toggle Mobile View Mode"
                >
                  {viewMode === 'continuous' ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> 1-PAGE
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5 text-indigo-400" /> TABS
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE A: CONTINUOUS ONE-PAGE STREAMLINED DASHBOARD */}
          {viewMode === 'continuous' ? (
            <div className="space-y-5">
              {/* SECTION 1: LIVE MARKET / QUESTION BOARD */}
              <section id="market" className="space-y-4">
                {currentRound && activeQuestion && (
                  <CountdownTimer
                    totalSeconds={activeQuestion.timerSeconds || 30}
                    startTime={currentRound.startTime}
                    onExpire={handleAutoLock}
                  />
                )}

                {/* CASE A: WAITING ROOM */}
                {gameState?.status === 'WAITING' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="font-mono text-xl font-bold text-white">MARKET WAITING ROOM</h3>
                    <p className="text-xs font-mono text-slate-400 max-w-xs mx-auto">
                      You are connected to the market terminal. Start the match directly or wait for the host.
                    </p>
                    <div className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono text-slate-400">
                      PIN: {gameState?.gamePin} • Starting Capital: {formatINR(gameState?.startingCapital || 10000)}
                    </div>

                    {/* DEMO AUTO-HOST BUTTON */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic([30, 50]);
                          try {
                            await fetch('/api/admin/round/start', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ gameId: activeGameId }),
                            });
                            await fetchState();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-mono font-bold text-sm rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-slate-950" /> START ROUND 1 NOW ⚡
                      </button>
                    </div>
                  </div>
                )}

                {/* CASE B: POSITION LOCKED */}
                {currentPosition && (
                  <LockedPositionCard
                    selectedAnswer={currentPosition.selectedAnswer}
                    riskName={currentPosition.riskLevel.name}
                    exposedCapital={currentPosition.exposedCapital}
                    potentialWin={currentPosition.potentialWin}
                    potentialLoss={currentPosition.potentialLoss}
                  />
                )}

                {/* CASE C: MARKET OPEN FOR TRADING */}
                {!currentPosition && activeQuestion && (gameState?.status === 'ROUND_START' || gameState?.status === 'QUESTION_LIVE' || gameState?.status === 'POSITION_SUBMISSION') && (
                  <div className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-xs">
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    <QuestionCard
                      question={activeQuestion}
                      selectedOption={selectedOption}
                      onSelectOption={(opt) => {
                        triggerHaptic(15);
                        setSelectedOption(opt);
                      }}
                    />

                    {riskLevels.length > 0 && participant && (
                      <RiskSelector
                        riskLevels={riskLevels}
                        selectedRiskId={selectedRisk?.id || ''}
                        onSelect={(r) => {
                          triggerHaptic(10);
                          setSelectedRisk(r);
                        }}
                        currentCapital={participant.currentCapital}
                        multiplier={currentRound?.multiplier || 1.0}
                      />
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={submitting || !selectedOption}
                        onClick={handleSubmitPosition}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-mono font-bold text-base rounded-2xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          'TRANSMITTING ORDER...'
                        ) : (
                          <>
                            <Lock className="w-5 h-5" /> CONFIRM & LOCK POSITION 🔒
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* CASE D: MARKET REVEAL & SETTLEMENT */}
                {(gameState?.status === 'ANSWER_REVEAL' || gameState?.status === 'SETTLEMENT' || gameState?.status === 'LEADERBOARD_UPDATE') && (
                  <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-5 shadow-xl text-center space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 px-3 py-1 bg-cyan-950 rounded-full border border-cyan-500/30">
                      MARKET SETTLEMENT REVEAL
                    </span>
                    <h3 className="text-2xl font-mono font-bold text-white">
                      CORRECT ANSWER: <span className="text-emerald-400">OPTION {activeQuestion?.correctAnswer}</span>
                    </h3>
                    {activeQuestion?.explanation && (
                      <p className="text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        💡 {activeQuestion.explanation}
                      </p>
                    )}

                    {/* DEMO ADVANCE ROUND CONTROL */}
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic([20, 40]);
                          try {
                            if (currentRound) {
                              await fetch('/api/admin/round/settle', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ gameId: activeGameId, roundId: currentRound.id }),
                              });
                            }
                            await fetch('/api/admin/round/start', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ gameId: activeGameId }),
                            });
                            await fetchState();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowRight className="w-4 h-4" /> ADVANCE TO NEXT ROUND ⏩
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION 2: PORTFOLIO STATS CARD */}
              <section id="portfolio">
                {participant && (
                  <PortfolioCard
                    displayName={participant.displayName}
                    avatar={participant.avatar}
                    currentCapital={participant.currentCapital}
                    availableCash={participant.availableCash}
                    exposedCapital={participant.exposedCapital}
                    netPnL={participant.netPnL}
                    returnPercentage={participant.returnPercentage}
                    currentRound={gameState?.currentRound}
                    totalRounds={gameState?.totalRounds}
                    riskName={currentPosition?.riskLevel?.name}
                    compact={false}
                  />
                )}
              </section>

              {/* SECTION 3: REALTIME LEADERBOARD */}
              <section id="leaderboard">
                <Leaderboard entries={leaderboard} currentParticipantId={participantId || undefined} />
              </section>

              {/* SECTION 4: TRADE HISTORY & BADGES INLINE */}
              <section id="history" className="grid grid-cols-1 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" /> Recent Market Orders
                  </h3>

                  {history.length === 0 ? (
                    <div className="text-center py-4 text-xs font-mono text-slate-500">
                      No trades submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div key={item.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              Round {item.round.roundNumber.toString().padStart(2, '0')} • Option {item.selectedAnswer}
                              <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {item.riskLevel.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Exposed: {formatINR(item.exposedCapital)}</div>
                          </div>

                          <div className="text-right">
                            {item.settlement ? (
                              <div className={`font-bold ${item.settlement.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {item.settlement.result === 'WIN' ? `+${formatINR(item.settlement.profitLoss)}` : formatINR(item.settlement.profitLoss)}
                              </div>
                            ) : (
                              <span className="text-amber-400 font-semibold">LOCKED 🔒</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            /* VIEW MODE B: FOCUS TABS VIEW */
            <div className="space-y-4">
              {activeTab === 'market' && (
                <div className="space-y-4">
                  {currentRound && activeQuestion && (
                    <CountdownTimer
                      totalSeconds={activeQuestion.timerSeconds || 30}
                      startTime={currentRound.startTime}
                      onExpire={handleAutoLock}
                    />
                  )}

                  {!currentPosition && activeQuestion && (gameState?.status === 'ROUND_START' || gameState?.status === 'QUESTION_LIVE' || gameState?.status === 'POSITION_SUBMISSION') && (
                    <div className="space-y-4">
                      <QuestionCard
                        question={activeQuestion}
                        selectedOption={selectedOption}
                        onSelectOption={setSelectedOption}
                      />
                      {riskLevels.length > 0 && participant && (
                        <RiskSelector
                          riskLevels={riskLevels}
                          selectedRiskId={selectedRisk?.id || ''}
                          onSelect={setSelectedRisk}
                          currentCapital={participant.currentCapital}
                          multiplier={currentRound?.multiplier || 1.0}
                        />
                      )}
                      <button
                        type="button"
                        disabled={submitting || !selectedOption}
                        onClick={handleSubmitPosition}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 font-mono font-bold text-base rounded-2xl text-slate-950"
                      >
                        LOCK POSITION 🔒
                      </button>
                    </div>
                  )}

                  {currentPosition && (
                    <LockedPositionCard
                      selectedAnswer={currentPosition.selectedAnswer}
                      riskName={currentPosition.riskLevel.name}
                      exposedCapital={currentPosition.exposedCapital}
                      potentialWin={currentPosition.potentialWin}
                      potentialLoss={currentPosition.potentialLoss}
                    />
                  )}
                </div>
              )}

              {activeTab === 'portfolio' && participant && (
                <PortfolioCard
                  displayName={participant.displayName}
                  avatar={participant.avatar}
                  currentCapital={participant.currentCapital}
                  availableCash={participant.availableCash}
                  exposedCapital={participant.exposedCapital}
                  netPnL={participant.netPnL}
                  returnPercentage={participant.returnPercentage}
                  currentRound={gameState?.currentRound}
                  totalRounds={gameState?.totalRounds}
                  compact={false}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard entries={leaderboard} currentParticipantId={participantId || undefined} />
              )}

              {activeTab === 'history' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" /> Recent Market Orders
                  </h3>

                  {history.length === 0 ? (
                    <div className="text-center py-4 text-xs font-mono text-slate-500">
                      No trades submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div key={item.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              Round {item.round.roundNumber.toString().padStart(2, '0')} • Option {item.selectedAnswer}
                              <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {item.riskLevel.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Exposed: {formatINR(item.exposedCapital)}</div>
                          </div>

                          <div className="text-right">
                            {item.settlement ? (
                              <div className={`font-bold ${item.settlement.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {item.settlement.result === 'WIN' ? `+${formatINR(item.settlement.profitLoss)}` : formatINR(item.settlement.profitLoss)}
                              </div>
                            ) : (
                              <span className="text-amber-400 font-semibold">LOCKED 🔒</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* FLOATING STICKY MOBILE ORDER EXECUTION BAR (WHEN OPTION SELECTED & MARKET OPEN) */}
      {activeGameId && !currentPosition && selectedOption && (gameState?.status === 'ROUND_START' || gameState?.status === 'QUESTION_LIVE' || gameState?.status === 'POSITION_SUBMISSION') && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 py-2 bg-slate-950/95 border-t border-cyan-500/40 backdrop-blur-xl animate-bounceIn">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="text-xs font-mono">
              <span className="text-slate-400 block">SELECTED ORDER</span>
              <span className="text-cyan-400 font-bold">OPTION {selectedOption} ({selectedRisk?.name || 'MEDIUM'})</span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitPosition}
              className="px-5 py-3 bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 active:scale-95 transition"
            >
              <Lock className="w-4 h-4" /> CONFIRM & LOCK 🔒
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {activeGameId && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-2">
          <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                if (viewMode === 'continuous') {
                  document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('market');
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'market' || viewMode === 'continuous' ? 'bg-slate-900 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">Market</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                if (viewMode === 'continuous') {
                  document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('portfolio');
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'portfolio' ? 'bg-slate-900 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                if (viewMode === 'continuous') {
                  document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('leaderboard');
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'leaderboard' ? 'bg-slate-900 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">Ranks</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                if (viewMode === 'continuous') {
                  document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('history');
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'history' ? 'bg-slate-900 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">Trades</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                localStorage.removeItem('last_game_id');
                setActiveGameId(null);
                setParticipantId(null);
              }}
              className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all text-rose-500 hover:text-rose-400"
              title="Leave Game Session"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-[10px] font-mono mt-0.5">Exit</span>
            </button>
          </div>
        </nav>
      )}

      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-slate-900">
        KNOWLEDGE EXCHANGE • MOBILE VIRTUAL CAPITAL TERMINAL
      </footer>
    </div>
  );
}

