'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Plus, FileText, CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

function QuestionManagerContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') || '777888';

  const [questions, setQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [category, setCategory] = useState('Stock Markets');
  const [difficulty, setDifficulty] = useState('Medium');
  const [explanation, setExplanation] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/admin/questions?gameId=${gameId}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [gameId]);

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetch(`/api/admin/questions?questionId=${questionId}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          category,
          difficulty,
          explanation,
          timerSeconds,
          orderIndex: questions.length + 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setExplanation('');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar role="admin" />

      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase">QUESTION MANAGEMENT</h1>
              <p className="text-xs font-mono text-slate-400">Configure market opportunity questions for championship rounds.</p>
            </div>
          </div>
        </div>

        {/* CREATE QUESTION FORM */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> Add New Question
          </h2>

          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Question Prompt</label>
              <input
                type="text"
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. What financial derivative gives the holder the right to BUY an asset?"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 font-mono text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Option A</label>
                <input
                  type="text"
                  required
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Option B</label>
                <input
                  type="text"
                  required
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Option C</label>
                <input
                  type="text"
                  required
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Option D</label>
                <input
                  type="text"
                  required
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Correct Answer</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-cyan-400 font-bold outline-none"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Timer (Seconds)</label>
                <input
                  type="number"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-mono text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Explanation / Analysis</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explanation revealed to participants after market close..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 font-mono text-sm text-white outline-none h-20"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-sm rounded-xl shadow-lg flex items-center gap-2"
            >
              {saving ? 'SAVING...' : 'PUBLISH QUESTION TO GAME'}
            </button>
          </form>
        </div>

        {/* QUESTIONS LIST */}
        <div className="space-y-3">
          <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Published Questions ({questions.length})
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      Q{idx + 1} • {q.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Correct: Option {q.correctAnswer}</span>
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white">{q.questionText}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                    {q.timerSeconds}s Timer
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/30 hover:bg-rose-900 transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuestionManagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono text-xs">Loading questions...</div>}>
      <QuestionManagerContent />
    </Suspense>
  );
}
