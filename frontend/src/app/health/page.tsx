'use client';
import { useState, useEffect } from 'react';
import { Activity, Database, Server, Wifi, Cpu, HardDrive } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);
  
  useEffect(() => {
    const fetchHealth = () => fetch('http://localhost:8000/api/health').then(r => r.json()).then(setHealth);
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const renderStatus = (status: string) => {
    if (status === 'HEALTHY' || status === 'RUNNING') return <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">{status}</span>;
    if (status === 'DEGRADED') return <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded">{status}</span>;
    return <span className="text-slate-400 font-bold bg-slate-400/10 px-2 py-1 rounded">{status}</span>;
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Activity className="text-emerald-400" size={28} />
        <h1 className="text-2xl font-bold text-white">System Diagnostics</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Server size={20} className="text-cyan-400"/> Core Microservices</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center"><span className="text-slate-300">Event Ingestion</span> {renderStatus(health?.event_ingestion || 'UNKNOWN')}</div>
             <div className="flex justify-between items-center"><span className="text-slate-300">Correlation Engine</span> {renderStatus(health?.correlation_engine || 'UNKNOWN')}</div>
             <div className="flex justify-between items-center"><span className="text-slate-300">Prediction Engine</span> {renderStatus(health?.prediction_engine || 'UNKNOWN')}</div>
             <div className="flex justify-between items-center"><span className="text-slate-300">Spatial Engine</span> {renderStatus(health?.spatial_engine || 'UNKNOWN')}</div>
           </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Database size={20} className="text-indigo-400"/> Data Persistence</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center"><span className="text-slate-300">Database Status</span> {renderStatus(health?.database || 'UNKNOWN')}</div>
             <div className="flex justify-between items-center"><span className="text-slate-300">Database Size</span> <span className="font-mono text-white">{health?.db_size_mb || 0} MB</span></div>
             <div className="flex justify-between items-center"><span className="text-slate-300">Queue Depth</span> <span className="font-mono text-white">{health?.queue_depth || 0}</span></div>
           </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Cpu size={20} className="text-rose-400"/> Model Status</h3>
             <p className="text-sm text-slate-400 mb-4">Currently loaded T-GNN model in memory.</p>
             <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Active Version</div>
                <div className="text-cyan-400 font-mono font-bold text-lg">{health?.model_version || 'Loading...'}</div>
             </div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-slate-700">
             <div className="text-slate-400 text-xs mb-1">Simulation Time (IST)</div>
             <div className="text-white font-mono">{health?.simulation_time ? new Date(health.simulation_time).toLocaleString() : 'Loading...'}</div>
             <div className="mt-2 text-xs">{renderStatus(health?.simulation_status || 'UNKNOWN')}</div>
           </div>
        </div>
      </div>
    </div>
  );
}
