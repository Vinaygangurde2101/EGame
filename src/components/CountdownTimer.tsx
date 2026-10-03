'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  totalSeconds: number;
  startTime?: string | Date;
  onExpire?: () => void;
  compact?: boolean;
}

export default function CountdownTimer({
  totalSeconds,
  startTime,
  onExpire,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    let timer: any;
    let hasExpired = false;

    if (startTime) {
      const startMs = new Date(startTime).getTime();
      const endMs = startMs + totalSeconds * 1000;

      const update = () => {
        const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0 && onExpire && !hasExpired) {
          hasExpired = true;
          onExpire();
        }
      };

      update();
      timer = setInterval(update, 500);
    } else {
      setTimeLeft(totalSeconds);
    }

    return () => clearInterval(timer);
  }, [totalSeconds, startTime, onExpire]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
  const isUrgent = timeLeft <= 5;
  const isWarning = timeLeft <= 10;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-500 animate-bounce' : isWarning ? 'text-amber-400' : 'text-cyan-400'}`} />
        <span className={`font-mono text-sm font-bold ${isUrgent ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'}`}>
          00:{timeLeft.toString().padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} /> Market Window
        </span>
        <span
          className={`font-mono text-base font-bold tracking-widest ${
            isUrgent ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-cyan-400'
          }`}
        >
          00:{timeLeft.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isUrgent
              ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
              : isWarning
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
              : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
