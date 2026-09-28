'use client';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { ShieldCheck, Lock, User, AlertCircle, Zap } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { badge: 'i4c_analyst', label: 'I4C Analyst', role: 'I4C', color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { badge: 'lea_officer', label: 'LEA Officer', role: 'LEA', color: 'text-amber-400', border: 'border-amber-500/30' },
  { badge: 'bank_officer', label: 'Bank Officer', role: 'BANK', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { badge: 'supervisor', label: 'Supervisor', role: 'SUPERVISOR', color: 'text-purple-400', border: 'border-purple-500/30' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Invalid credentials.');
        return;
      }
      const data = await res.json();
      login(data.token, data.user);
    } catch {
      setError('Cannot connect to backend. Ensure the server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (badge: string) => {
    setUsername(badge);
    setPassword('demo123');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: badge, password: 'demo123' })
      });
      if (!res.ok) { setError('Quick login failed.'); return; }
      const data = await res.json();
      login(data.token, data.user);
    } catch {
      setError('Cannot connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030712] p-4 relative overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-b from-slate-800/70 to-slate-900/70 p-8 rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 p-4 rounded-2xl text-cyan-400" style={{boxShadow: '0 0 40px rgba(6, 182, 212, 0.15)'}}>
              <ShieldCheck size={44} strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-1 tracking-wide">CyberCash Sentinel</h1>
          <p className="text-slate-400 text-center text-sm mb-1">Ministry of Home Affairs / I4C</p>
          <p className="text-center text-xs mb-6">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-widest uppercase">
              Prototype — Synthetic Data
            </span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Badge ID / Username</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. i4c_analyst"
                  required
                />
                <User size={16} className="absolute left-3.5 top-3 text-slate-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo123"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-500" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
              style={{boxShadow: '0 0 25px rgba(6, 182, 212, 0.2)'}}
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>

          <div className="border-t border-slate-700/50 pt-4">
            <p className="text-slate-500 text-[10px] mb-3 text-center uppercase tracking-[0.15em] flex items-center gap-2 justify-center font-medium">
              <Zap size={11} /> Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.badge}
                  onClick={() => quickLogin(acc.badge)}
                  disabled={loading}
                  className={`text-left p-3 bg-slate-900/60 border ${acc.border} rounded-xl hover:bg-slate-800/60 transition-all duration-200 disabled:opacity-50 group`}
                >
                  <div className={`text-xs font-bold ${acc.color}`}>{acc.role}</div>
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5 group-hover:text-slate-400 transition-colors">{acc.badge}</div>
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-[10px] text-center mt-3">
              All passwords: <span className="text-slate-400 font-mono">demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
