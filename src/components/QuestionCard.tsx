'use client';

import { CheckCircle2, HelpCircle } from 'lucide-react';

interface QuestionData {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
  difficulty: string;
}

interface QuestionCardProps {
  question: QuestionData;
  selectedOption: string;
  onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  selectedOption,
  onSelectOption,
  disabled = false,
}: QuestionCardProps) {
  const options = [
    { key: 'A', label: question.optionA },
    { key: 'B', label: question.optionB },
    { key: 'C', label: question.optionC },
    { key: 'D', label: question.optionD },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Category & Difficulty pills */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-full">
          {question.category}
        </span>
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            question.difficulty === 'Easy'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
              : question.difficulty === 'Medium'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
              : question.difficulty === 'Hard'
              ? 'bg-amber-950 text-amber-300 border-amber-500/30'
              : 'bg-rose-950 text-rose-300 border-rose-500/30'
          }`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <div className="my-3">
        <h2 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight font-sans">
          {question.questionText}
        </h2>
      </div>

      {/* Option Cards */}
      <div className="space-y-2.5 mt-4">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(opt.key as any)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/80 scale-[1.01]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
              } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    isSelected ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt.key}
                </div>
                <span className="text-sm font-medium leading-tight">{opt.label}</span>
              </div>

              {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
