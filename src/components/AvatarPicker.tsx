'use client';

export const AVATARS = [
  { id: 'bull', name: 'Bull Market', emoji: '🐂', color: 'from-emerald-500 to-teal-700' },
  { id: 'bear', name: 'Bear Hunter', emoji: '🐻', color: 'from-amber-500 to-orange-700' },
  { id: 'fox', name: 'Cyber Fox', emoji: '🦊', color: 'from-orange-500 to-red-700' },
  { id: 'lion', name: 'Apex Lion', emoji: '🦁', color: 'from-yellow-500 to-amber-700' },
  { id: 'eagle', name: 'Alpha Eagle', emoji: '🦅', color: 'from-cyan-500 to-blue-700' },
  { id: 'phoenix', name: 'Phoenix Quant', emoji: '🔥', color: 'from-red-500 to-rose-700' },
  { id: 'wolf', name: 'Wall St Wolf', emoji: '🐺', color: 'from-slate-500 to-slate-800' },
  { id: 'shark', name: 'Hedge Shark', emoji: '🦈', color: 'from-indigo-500 to-purple-800' },
  { id: 'dragon', name: 'Crypto Dragon', emoji: '🐉', color: 'from-violet-500 to-purple-900' },
  { id: 'rocket', name: 'To The Moon', emoji: '🚀', color: 'from-sky-400 to-indigo-600' },
];

interface AvatarPickerProps {
  selected: string;
  onSelect: (avatarId: string) => void;
}

export default function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
        Choose Your Market Avatar
      </label>
      <div className="grid grid-cols-5 gap-2">
        {AVATARS.map((av) => {
          const isSelected = selected === av.id;
          return (
            <button
              key={av.id}
              type="button"
              onClick={() => onSelect(av.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105 ring-2 ring-cyan-400/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${av.color} flex items-center justify-center text-xl shadow-inner`}
              >
                {av.emoji}
              </div>
              <span className="text-[10px] font-mono text-slate-300 mt-1 truncate w-full text-center">
                {av.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
