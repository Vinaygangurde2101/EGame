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

    socket.on('game_state_changed', () => fetchState());
    socket.on('round_started', () => fetchState());
    socket.on('market_locked', () => fetchState());
    socket.on('answer_revealed', () => fetchState());
    socket.on('settlement_completed', (payload: any) => {
      setSummary(payload.summary);
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
