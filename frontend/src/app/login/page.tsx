'use client';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { ShieldCheck, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('mock-jwt-token');
  };

  return (
    <div className="flex items-center justify-center h-full bg-[#0b1120]">
      <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 w-96">
        <div className="flex justify-center mb-6">
          <div className="bg-cyan-500/20 p-4 rounded-xl text-cyan-400">
            <ShieldCheck size={48} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">CyberCash Sentinel</h1>
        <p className="text-slate-400 text-center mb-8">Secure Command Interface</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Badge ID / Email</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Passcode</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} className="absolute right-3 top-3 text-slate-500" />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg transition-colors mt-6"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
