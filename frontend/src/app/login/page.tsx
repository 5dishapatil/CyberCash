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
    <div className="flex items-center justify-center min-h-screen bg-[#0b1120] p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 shadow-2xl shadow-black/50">
          <div className="flex justify-center mb-6">
            <div className="bg-cyan-500/20 p-4 rounded-xl text-cyan-400 ring-1 ring-cyan-500/20">
              <ShieldCheck size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-1">CyberCash Sentinel</h1>
          <p className="text-slate-400 text-center text-sm mb-1">Ministry of Home Affairs / I4C</p>
          <p className="text-center text-xs mb-6">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">
              PROTOTYPE — SYNTHETIC DATA
            </span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Badge ID / Username</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:border-cyan-500 transition"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. i4c_analyst"
                  required
                />
                <User size={16} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:border-cyan-500 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo123"
                  required
                />
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>

          <div className="border-t border-slate-700 pt-4">
            <p className="text-slate-500 text-xs mb-3 text-center uppercase tracking-wider flex items-center gap-2 justify-center">
              <Zap size={12} /> Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.badge}
                  onClick={() => quickLogin(acc.badge)}
                  disabled={loading}
                  className={`text-left p-2.5 bg-slate-900 border ${acc.border} rounded-lg hover:bg-slate-800 transition disabled:opacity-50`}
                >
                  <div className={`text-xs font-bold ${acc.color}`}>{acc.role}</div>
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">{acc.badge}</div>
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
