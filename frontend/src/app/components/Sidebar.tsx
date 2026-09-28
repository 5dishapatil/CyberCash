'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, AlertTriangle, Map, GitBranch, TrendingUp,
  FileText, FlaskConical, Brain, Shield, Activity, ShieldCheck, LogOut
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NAV_ITEMS = [
  { name: 'Command Centre', href: '/', icon: LayoutDashboard, roles: ['I4C', 'LEA', 'SUPERVISOR', 'BANK', 'JUDGE'] },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle, roles: ['I4C', 'LEA', 'SUPERVISOR', 'BANK', 'JUDGE'] },
  { name: 'GIS Intelligence', href: '/gis', icon: Map, roles: ['I4C', 'LEA', 'SUPERVISOR', 'JUDGE'] },
  { name: 'Network Analysis', href: '/network', icon: GitBranch, roles: ['I4C', 'LEA', 'SUPERVISOR', 'JUDGE'] },
  { name: 'Predictions', href: '/predictions', icon: TrendingUp, roles: ['I4C', 'LEA', 'SUPERVISOR', 'JUDGE'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['I4C', 'SUPERVISOR', 'BANK', 'JUDGE'] },
  { name: 'Simulation Lab', href: '/simulation', icon: FlaskConical, roles: ['I4C', 'SUPERVISOR', 'JUDGE'] },
  { name: 'Model Ops', href: '/model-ops', icon: Brain, roles: ['I4C', 'SUPERVISOR', 'JUDGE'] },
  { name: 'Audit & Security', href: '/audit', icon: Shield, roles: ['I4C', 'SUPERVISOR', 'JUDGE'] },
  { name: 'System Health', href: '/health', icon: Activity, roles: ['I4C', 'SUPERVISOR', 'JUDGE'] },
];

const ROLE_COLORS: Record<string, string> = {
  I4C: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  LEA: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  BANK: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  SUPERVISOR: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  JUDGE: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export default function Sidebar() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');
  const { user, logout } = useAuth();

  useEffect(() => {
    const updateTime = () => setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLoginPage = pathname === '/login';
  if (isLoginPage) return null;

  const visibleItems = NAV_ITEMS.filter(item =>
    !user || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0a0f1e] via-[#0c1425] to-[#0a0f1e] text-slate-300 h-screen fixed top-0 left-0 flex flex-col border-r border-slate-800/60 z-50" style={{boxShadow: '1px 0 30px rgba(0,0,0,0.4)'}}>
      <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 p-2.5 rounded-xl text-cyan-400" style={{boxShadow: '0 0 20px rgba(167, 139, 250, 0.15)'}}>
          <ShieldCheck size={22} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-tight tracking-wide text-[15px]">CyberCash</span>
          <span className="text-cyan-400 font-semibold text-[11px] leading-tight tracking-[0.2em] uppercase">Sentinel</span>
        </div>
      </div>

      {user && (
        <div className="px-5 py-3.5 border-b border-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user.full_name}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1.5 inline-block uppercase tracking-wider ${ROLE_COLORS[user.role] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-500 hover:text-rose-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-rose-500/10 shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 text-cyan-400 font-medium'
                      : 'hover:bg-white/[0.03] hover:text-white'
                  }`}
                  style={isActive ? {boxShadow: 'inset 0 0 20px rgba(167, 139, 250, 0.05)'} : {}}
                >
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full" style={{boxShadow: '0 0 8px rgba(167, 139, 250, 0.6)'}} />}
                  <Icon size={17} className={`transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="text-[13px]">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-800/60 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-medium">System Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
        <div className="flex flex-col gap-1 text-slate-500">
          <span className="text-[10px]">Source: SYNTHETIC</span>
          <span className="font-mono text-[9px] text-slate-600">{time}</span>
        </div>
      </div>
    </aside>
  );
}
