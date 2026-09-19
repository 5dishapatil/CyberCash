'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  GitBranch,
  TrendingUp,
  FileText,
  FlaskConical,
  Brain,
  Shield,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { name: 'Command Centre', href: '/', icon: LayoutDashboard },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'GIS Intelligence', href: '/gis', icon: Map },
  { name: 'Network Analysis', href: '/network', icon: GitBranch },
  { name: 'Predictions', href: '/predictions', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Simulation Lab', href: '/simulation', icon: FlaskConical },
  { name: 'Model Ops', href: '/model-ops', icon: Brain },
  { name: 'Audit & Security', href: '/audit', icon: Shield },
  { name: 'System Health', href: '/health', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 h-screen fixed top-0 left-0 flex flex-col border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400">
          <ShieldCheck size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-tight">CyberCash</span>
          <span className="text-cyan-500 font-semibold text-sm leading-tight">SENTINEL</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
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
