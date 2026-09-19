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
    <aside className="w-64 bg-[#0f172a] text-slate-300 h-screen fixed top-0 left-0 flex flex-col border-r border-slate-800 z-50">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400">
          <ShieldCheck size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-tight">CyberCash</span>
          <span className="text-cyan-500 font-semibold text-sm leading-tight">SENTINEL</span>
        </div>
      </div>

      {user && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user.full_name}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border mt-1 inline-block ${ROLE_COLORS[user.role] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded hover:bg-rose-500/10 shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                      : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">System Status</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            HEALTHY
          </span>
        </div>
        <div className="flex flex-col gap-1 text-slate-500">
          <span>Source: SYNTHETIC</span>
          <span className="font-mono text-[10px]">{time}</span>
        </div>
      </div>
    </aside>
  );
}
