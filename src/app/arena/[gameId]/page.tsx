'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import ArenaDisplay from '@/components/ArenaDisplay';

export default function ArenaPage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;

  const [gameState, setGameState] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

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
    } catch (err) {
      console.error('Arena fetch error:', err);
    }
  };

  useEffect(() => {
    fetchState();

    const socket = io();
    socket.emit('join_game', { gameId, role: 'arena' });

    socket.on('game_state_changed', (payload: any) => {
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status, currentRound: payload.currentRound ?? prev.currentRound } : prev);
      }
      fetchState();
    });

    socket.on('round_started', (payload: any) => {
      if (payload?.currentRound) setCurrentRound(payload.currentRound);
      if (payload?.activeQuestion) setActiveQuestion(payload.activeQuestion);
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status, currentRound: payload.roundNumber } : prev);
      }
      fetchState();
    });

    socket.on('market_locked', (payload: any) => {
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      }
      fetchState();
    });

    socket.on('answer_revealed', (payload: any) => {
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      }
      if (payload?.correctAnswer) {
        setActiveQuestion((prev: any) => prev ? { ...prev, correctAnswer: payload.correctAnswer, explanation: payload.explanation } : prev);
      }
      fetchState();
    });

    socket.on('settlement_completed', (payload: any) => {
      if (payload?.summary) setSummary(payload.summary);
      if (payload?.leaderboard) setLeaderboard(payload.leaderboard);
      if (payload?.status) {
        setGameState((prev: any) => prev ? { ...prev, status: payload.status } : prev);
      }
      fetchState();
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId]);


  return (
    <ArenaDisplay
      game={gameState}
      currentRound={currentRound}
      activeQuestion={activeQuestion}
      leaderboard={leaderboard}
      summary={summary}
    />
  );
}
