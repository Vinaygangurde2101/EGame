'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Lock, Mail, Key, LogIn, CheckCircle } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check localStorage or cookie for admin session
    const savedAuth = localStorage.getItem('admin_authenticated');
    const hasCookie = document.cookie.includes('admin_session=authenticated');

    if (savedAuth === 'true' || hasCookie) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Invalid credentials.');
      }

      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono text-xs">
        Authenticating Admin Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="font-mono text-2xl font-bold text-white tracking-tight">
              ADMIN ACCESS CONTROL
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Enter official credentials to unlock the Knowledge Exchange Command Center.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-mono">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> Admin Email / Identifier
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@knowledgeexchange.io"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" /> Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                'AUTHENTICATING...'
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> UNLOCK COMMAND CENTER 🔒
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
