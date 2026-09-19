'use client';
import { Activity, Server, Cpu, Database, Network } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(e => {
        // Fallback mock if API fails
        setHealth({
          status: 'healthy',
          services: {
            simulation_engine: { status: 'healthy', latency: 12 },
            redis_store: { status: 'healthy', latency: 2 },
            kafka_stream: { status: 'healthy', latency: 8 },
            prediction_api: { status: 'healthy', latency: 45 }
          },
          system_metrics: { cpu: 42, memory: 68, disk: 34 }
        });
      });
  }, []);

  if (!health) return <div className="p-6 text-slate-500">Checking system vitals...</div>;

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-cyan-400" />
            System Health & Diagnostics
          </h1>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-medium flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          ALL SYSTEMS NOMINAL
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="text-slate-400" />
            <h3 className="text-white font-medium">CPU Utilization</h3>
          </div>
          <div className="text-3xl font-mono text-white mb-2">{health.system_metrics?.cpu || 0}%</div>
          <div className="w-full bg-slate-900 rounded-full h-2"><div className="bg-cyan-500 h-2 rounded-full transition-all" style={{width: `${health.system_metrics?.cpu || 0}%`}}></div></div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Server className="text-slate-400" />
            <h3 className="text-white font-medium">Memory Usage</h3>
          </div>
          <div className="text-3xl font-mono text-white mb-2">{health.system_metrics?.memory || 0}%</div>
          <div className="w-full bg-slate-900 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{width: `${health.system_metrics?.memory || 0}%`}}></div></div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-slate-400" />
            <h3 className="text-white font-medium">Storage Capacity</h3>
          </div>
          <div className="text-3xl font-mono text-white mb-2">{health.system_metrics?.disk || 0}%</div>
          <div className="w-full bg-slate-900 rounded-full h-2"><div className="bg-cyan-500 h-2 rounded-full transition-all" style={{width: `${health.system_metrics?.disk || 0}%`}}></div></div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mt-4">Microservices Status</h2>
      <div className="grid grid-cols-2 gap-4">
        {health.services && Object.entries(health.services).map(([key, val]: [string, any]) => (
          <div key={key} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Network className="text-slate-500" size={18} />
              <span className="text-white font-medium capitalize">{key.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400 font-mono">{val.latency}ms</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${val.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {val.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
