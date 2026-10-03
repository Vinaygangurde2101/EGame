'use client';

import { Brain, Zap, ShieldCheck, TrendingUp, Flame, Gem, Award } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Brain,
  Zap,
  ShieldCheck,
  TrendingUp,
  Flame,
  Gem,
};

interface AchievementBadgeProps {
  name: string;
  description: string;
  iconName: string;
  earned?: boolean;
}

export default function AchievementBadge({ name, description, iconName, earned = true }: AchievementBadgeProps) {
  const IconComponent = ICON_MAP[iconName] || Award;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        earned
          ? 'bg-slate-900/90 border-cyan-500/40 text-white shadow-md'
          : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          earned ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-inner' : 'bg-slate-800 text-slate-600'
        }`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs font-mono font-bold uppercase tracking-wide">{name}</h4>
        <p className="text-[11px] font-mono text-slate-400 leading-tight mt-0.5">{description}</p>
      </div>
    </div>
  );
}
