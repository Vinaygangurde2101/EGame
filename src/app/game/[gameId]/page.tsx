'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
import MarketMoverCard from '@/components/MarketMoverCard';
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
  CheckCircle,
  XCircle,
} from 'lucide-react';

function PlayerGameContent({ gameId }: { gameId: string }) {
  const searchParams = useSearchParams();
  const [participantId, setParticipantId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'continuous' | 'tabs'>('continuous');
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'leaderboard' | 'history' | 'achievements'>('market');

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

  // Haptic feedback for mobile
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  // 1. Resolve participantId from URL or localStorage
  useEffect(() => {
    let pid = searchParams.get('participantId');
    if (!pid) {
      pid = localStorage.getItem(`participant_${gameId}`);
    }
    if (pid) {
      setParticipantId(pid);
    }
  }, [gameId, searchParams]);

  const isFetchingRef = useRef(false);

  // 2. Fetch authoritative state from Server
  const fetchState = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const url = participantId
        ? `/api/game/${gameId}?participantId=${participantId}`
        : `/api/game/${gameId}`;
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
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchState();
  }, [gameId, participantId]);

  // 3. Socket.IO Realtime Reconnection & Multi-Room State Listener
  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] });

    socket.emit('join_game', {
      gameId,
      gamePin: gameState?.gamePin || gameId,
      participantId: participantId || undefined,
      role: 'player',
    });

    socket.on('game_state_changed', (payload) => {
      if (payload?.status) {
        setGameState((prev: any) => (prev ? { ...prev, status: payload.status, currentRound: payload.currentRound ?? prev.currentRound } : prev));
      }
      fetchState();
    });

    socket.on('round_started', (payload) => {
      setSelectedOption('');
      setCurrentPosition(null);
      if (payload?.currentRound) setCurrentRound(payload.currentRound);
      if (payload?.activeQuestion) setActiveQuestion(payload.activeQuestion);
      if (payload?.status) {
        setGameState((prev: any) => (prev ? { ...prev, status: payload.status, currentRound: payload.roundNumber } : prev));
      }
      fetchState();
    });

    socket.on('market_locked', (payload) => {
      if (payload?.status) {
        setGameState((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      }
      fetchState();
    });

    socket.on('answer_revealed', (payload) => {
      if (payload?.status) {
        setGameState((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      }
      if (payload?.correctAnswer) {
        setActiveQuestion((prev: any) => (prev ? { ...prev, correctAnswer: payload.correctAnswer, explanation: payload.explanation } : prev));
      }
      fetchState();
    });

    socket.on('settlement_completed', (payload) => {
      if (payload?.status) {
        setGameState((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      }
      if (payload?.leaderboard) setLeaderboard(payload.leaderboard);
      fetchState();
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId, participantId, gameState?.gamePin]);

  // 4. Smart Heartbeat Backup (2.5s interval during active round transitions to prevent missing updates)
  useEffect(() => {
    const activeStatuses = ['ROUND_START', 'QUESTION_LIVE', 'POSITION_SUBMISSION', 'MARKET_LOCKED', 'ANSWER_REVEAL'];
    if (!gameState?.status || !activeStatuses.includes(gameState.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchState();
    }, 2500);

    return () => clearInterval(interval);
  }, [gameState?.status, gameId, participantId]);




  // Handle timer expiration locally without calling admin endpoints
  const handleTimerExpire = () => {
    setGameState((prev: any) => (prev ? { ...prev, status: 'MARKET_LOCKED' } : prev));
    fetchState();
  };

  // Handle Position Submission
  const handleSubmitPosition = async () => {
    if (gameState?.status === 'MARKET_LOCKED' || gameState?.status === 'ANSWER_REVEAL' || gameState?.status === 'SETTLEMENT') {
      setErrorMessage('Market is currently locked for this round.');
      return;
    }
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
      <Navbar gamePin={gameState?.gamePin} gameId={gameId} currentCapital={participant?.currentCapital} />

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
                title="Toggle View Mode"
              >
                {viewMode === 'continuous' ? '1-PAGE' : 'TABS'}
              </button>
            </div>
          </div>
        )}

        {/* CONTINUOUS ONE-PAGE STREAMLINED VIEW */}
        {viewMode === 'continuous' ? (
          <div className="space-y-5">
            {/* 1. MARKET QUESTION SECTION */}
            <section id="market" className="space-y-4">
              {currentRound && activeQuestion && (
                <CountdownTimer
                  totalSeconds={activeQuestion.timerSeconds || 30}
                  startTime={currentRound.startTime}
                  onExpire={handleTimerExpire}
                />
              )}

              {/* WAITING ROOM */}
              {gameState?.status === 'WAITING' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
                  </div>
                  <h3 className="font-mono text-xl font-bold text-white">TRADER LOBBY • WAITING ROOM</h3>
                  <p className="text-xs font-mono text-slate-400">
                    You are connected to the live trading server. The game host will start Round 1 shortly.
                  </p>
                  <div className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono text-cyan-300">
                    PIN: {gameState?.gamePin} • Starting Capital: {formatINR(gameState?.startingCapital || 10000)}
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Waiting for host to initiate market...
                  </div>
                </div>
              )}

              {/* FALLBACK IF QUESTION MISSING */}
              {!activeQuestion && gameState?.status !== 'WAITING' && gameState?.status !== 'GAME_FINISHED' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="font-mono text-base font-bold text-white">NEXT ROUND PREPARATION</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Host is loading the question for Round {gameState?.currentRound || 1}. Stand by...
                  </p>
                </div>
              )}

              {/* POSITION LOCKED */}
              {currentPosition && (
                <LockedPositionCard
                  selectedAnswer={currentPosition.selectedAnswer}
                  riskName={currentPosition.riskLevel.name}
                  exposedCapital={currentPosition.exposedCapital}
                  potentialWin={currentPosition.potentialWin}
                  potentialLoss={currentPosition.potentialLoss}
                />
              )}

              {/* LIVE MARKET FORM */}
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

              {/* REVEAL & NEXT ROUND WAITING */}
              {(gameState?.status === 'ANSWER_REVEAL' || gameState?.status === 'SETTLEMENT' || gameState?.status === 'LEADERBOARD_UPDATE') && (
                <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-5 shadow-xl text-center space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 px-3 py-1 bg-cyan-950 rounded-full border border-cyan-500/30">
                    MARKET REVEAL & SETTLEMENT
                  </span>
                  <h3 className="text-2xl font-mono font-bold text-white">
                    CORRECT ANSWER: <span className="text-emerald-400">OPTION {activeQuestion?.correctAnswer}</span>
                  </h3>
                  {activeQuestion?.explanation && (
                    <p className="text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      💡 {activeQuestion.explanation}
                    </p>
                  )}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-center gap-2 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>⚡ Live Automated Market Pipeline Active • Round {gameState?.currentRound} Processing</span>
                  </div>
                </div>
              )}
            </section>

            {/* 2. PORTFOLIO CARD */}
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

            {/* 3. LEADERBOARD */}
            <section id="leaderboard">
              <Leaderboard entries={leaderboard} currentParticipantId={participantId || undefined} />
            </section>

            {/* 4. HISTORY */}
            <section id="history">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" /> Recent Market Orders
                </h3>

                {history.length === 0 ? (
                  <div className="text-center py-4 text-xs font-mono text-slate-500">
                    No market positions locked yet.
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
          /* TABBED VIEW MODE */
          <div className="space-y-4">
            {activeTab === 'market' && (
              <div className="space-y-4">
                {currentRound && activeQuestion && (
                  <CountdownTimer
                    totalSeconds={activeQuestion.timerSeconds || 30}
                    startTime={currentRound.startTime}
                    onExpire={handleTimerExpire}
                  />
                )}

                {/* WAITING ROOM IN TAB VIEW */}
                {gameState?.status === 'WAITING' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
                    <Sparkles className="w-8 h-8 mx-auto text-cyan-400 animate-pulse" />
                    <h3 className="font-mono text-lg font-bold text-white">TRADER LOBBY</h3>
                    <p className="text-xs font-mono text-slate-400">Connected. Waiting for host to start Round 1...</p>
                  </div>
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
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 font-mono font-bold text-base rounded-2xl text-slate-950 shadow-xl flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" /> LOCK POSITION 🔒
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
                    No market positions locked yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="font-bold text-white">
                            Round {item.round.roundNumber.toString().padStart(2, '0')} • Option {item.selectedAnswer}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Exposed: {formatINR(item.exposedCapital)}</div>
                        </div>
                        <div>
                          {item.settlement ? (
                            <span className={`font-bold ${item.settlement.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.settlement.result === 'WIN' ? `+${formatINR(item.settlement.profitLoss)}` : formatINR(item.settlement.profitLoss)}
                            </span>
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

            {activeTab === 'achievements' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" /> Trader Achievements & Badges
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <AchievementBadge
                    name="FIRST ORDER"
                    description="Locked your first market position in the championship"
                    iconName="Zap"
                    earned={history.length > 0}
                  />
                  <AchievementBadge
                    name="CALCULATED RISK"
                    description="Submitted a position using HIGH or EXTREME risk leverage"
                    iconName="Flame"
                    earned={history.some((h) => h.riskLevel?.name === 'HIGH' || h.riskLevel?.name === 'EXTREME')}
                  />
                  <AchievementBadge
                    name="CAPITAL PRESERVATION"
                    description="Maintained positive net PnL in the current tournament"
                    iconName="ShieldCheck"
                    earned={(participant?.netPnL || 0) >= 0}
                  />
                  <AchievementBadge
                    name="MARKET MOVER"
                    description="Achieved top 3 rank on the live global leaderboard"
                    iconName="TrendingUp"
                    earned={Number(currentRank) <= 3}
                  />
                  <AchievementBadge
                    name="PORTFOLIO TITAN"
                    description="Grew starting capital by more than +25%"
                    iconName="Gem"
                    earned={(participant?.returnPercentage || 0) >= 25}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING STICKY MOBILE ORDER EXECUTION BAR */}
      {!currentPosition && selectedOption && (gameState?.status === 'ROUND_START' || gameState?.status === 'QUESTION_LIVE' || gameState?.status === 'POSITION_SUBMISSION') && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-4 py-2 bg-slate-950/95 border-t border-cyan-500/40 backdrop-blur-xl">
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
              setActiveTab('achievements');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              activeTab === 'achievements' ? 'bg-slate-900 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-mono mt-0.5">Badges</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function PlayerGamePage({ params }: { params: { gameId: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono text-xs">Loading game session...</div>}>
      <PlayerGameContent gameId={params.gameId} />
    </Suspense>
  );
}

