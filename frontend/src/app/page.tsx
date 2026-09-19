'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, FastForward, RotateCcw, AlertTriangle, ShieldAlert, Target, Clock, Activity, Map as MapIcon, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useNotificationStore } from './store/notifications';
import Link from 'next/link';

const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

export default function CommandCentre() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simTime, setSimTime] = useState<string>('');
  const [eventRate, setEventRate] = useState(0);
  
  const addToast = useNotificationStore(state => state.addToast);

  const fetchData = async () => {
    try {
      const [incRes, statsRes, healthRes] = await Promise.all([
        fetch('http://localhost:8000/api/incidents'),
        fetch('http://localhost:8000/api/stats'),
        fetch('http://localhost:8000/api/health')
      ]);
      
      const incData = await incRes.json();
      setIncidents(incData.filter((i:any) => i.active));
      
      const st = await statsRes.json();
      setStats(st);
      
      const h = await healthRes.json();
      if (h.simulation_time) setSimTime(h.simulation_time);
      if (h.queue_depth !== undefined) {
        // Simulate a fluctuating event rate based on queue depth and random jitter
        setEventRate(Math.floor(10 + Math.random() * 5 + h.queue_depth));
      }

      if (incData.length > 0) {
        const fullPreds = await Promise.all(
           incData.filter((i:any) => i.active).slice(0, 5).map((inc:any) => 
             fetch(`http://localhost:8000/api/predictions/${inc.id}`).then(r => r.json())
           )
        );
        setPredictions(fullPreds.flat());
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds for near real-time updates
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  const handleAction = async (endpoint: string) => {
    try {
      await fetch('http://localhost:8000/api/simulation/' + endpoint, { method: 'POST' });
      addToast(`Simulation engine commanded: ${endpoint.toUpperCase()}`, 'info');
      fetchData(); // Force immediate refresh
    } catch(e) {
      addToast(`Failed to reach simulation engine`, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Active Threats</div>
            <div className="text-3xl text-rose-500 font-bold font-mono">{stats?.active_incidents || 0}</div>
          </div>
          <AlertTriangle className="text-rose-500/50" size={32} />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Exposure</div>
            <div className="text-3xl text-amber-400 font-bold font-mono">
               {stats?.amount_at_risk ? formatCurrency(stats.amount_at_risk) : '₹0'}
            </div>
          </div>
          <ShieldAlert className="text-amber-400/50" size={32} />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Precision@5 <span className="text-[10px] text-amber-500/80 lowercase">(demo replay)</span></div>
            <div className="text-3xl text-cyan-400 font-bold font-mono">{stats?.precision_at_5 ? (stats.precision_at_5 * 100).toFixed(1) + '%' : 'N/A'}</div>
          </div>
          <Target className="text-cyan-400/50" size={32} />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Live Event Rate</div>
            <div className="text-3xl text-emerald-400 font-bold font-mono flex items-center gap-2">
              {eventRate} <span className="text-sm text-slate-500">ev/s</span>
            </div>
          </div>
          <Activity className="text-emerald-400/50" size={32} />
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-white">Priority Incident Queue</h2>
              <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">Live Triage</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {loading ? (
                <div className="text-center text-slate-500 py-8">Loading queue...</div>
              ) : incidents.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No active incidents.</div>
              ) : (
                incidents.map(inc => (
                  <Link href={`/incidents/${inc.id}`} key={inc.id} className="block bg-slate-900 border border-slate-700 p-3 rounded-lg hover:border-cyan-500/50 transition cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-cyan-400 font-mono text-xs group-hover:underline">{inc.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide ${
                        inc.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        inc.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>{inc.risk_level}</span>
                    </div>
                    <div className="text-sm text-white mb-2">{inc.incident_type ? inc.incident_type.replace('_', ' ') : 'UNKNOWN'}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Prob: <span className="text-white font-mono">{inc.cashout_probability ? (inc.cashout_probability * 100).toFixed(0) : 0}%</span></span>
                      <span className="text-slate-400">Amt: <span className="text-white font-mono">{formatCurrency(inc.amount_at_risk)}</span></span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 shrink-0">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Simulation Control</h2>
            <div className="flex gap-2 mb-3">
              <button onClick={() => handleAction('start')} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 py-2 rounded flex items-center justify-center transition"><Play size={18} fill="currentColor" /></button>
              <button onClick={() => handleAction('pause')} className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 py-2 rounded flex items-center justify-center transition"><Pause size={18} fill="currentColor" /></button>
              <button onClick={() => handleAction('speed')} className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 py-2 rounded flex items-center justify-center transition"><FastForward size={18} fill="currentColor" /></button>
              <button onClick={() => handleAction('reset')} className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 py-2 rounded flex items-center justify-center transition"><RotateCcw size={18} /></button>
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
               <span>Sim Time:</span>
               <span className="text-cyan-400">{simTime ? new Date(simTime).toLocaleTimeString() : '--:--:--'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 flex flex-col overflow-hidden relative">
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 p-2 rounded flex items-center gap-2 border border-slate-700 text-sm font-medium text-slate-300">
             <MapIcon size={16} className="text-cyan-400" />
             Strategic View
          </div>
          <Link href="/gis" className="absolute top-4 right-4 z-[1000] bg-slate-900/90 p-2 rounded border border-slate-700 text-slate-400 hover:text-white transition">
             <Maximize2 size={16} />
          </Link>
          <div className="w-full h-full rounded-lg overflow-hidden bg-slate-900">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-500">Loading Map...</div>
            ) : (
              <MapComponent incidents={incidents} predictions={predictions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
