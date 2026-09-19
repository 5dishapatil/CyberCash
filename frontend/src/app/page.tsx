'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Clock, 
  Target, 
  Play, 
  Pause, 
  RotateCcw,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const MapComponent = dynamic(() => import('./components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse rounded-lg flex items-center justify-center text-slate-500">Loading Strategic Map...</div>
});

export default function CommandCentre() {
  const [stats, setStats] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, simRes, incRes] = await Promise.all([
          fetch('http://localhost:8000/api/stats').catch(() => new Response('{}', { status: 500 })),
          fetch('http://localhost:8000/api/simulation/state').catch(() => new Response('{}', { status: 500 })),
          fetch('http://localhost:8000/api/incidents').catch(() => new Response('[]', { status: 500 }))
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (simRes.ok) setSimulation(await simRes.json());
        
        if (incRes.ok) {
          const incData = await incRes.json();
          setIncidents(incData);
          
          // Fetch predictions for these incidents
          // Simplified for prototype: normally we'd fetch in parallel or bulk
          const preds = [];
          for (const inc of incData.slice(0, 5)) {
            try {
              const pRes = await fetch(`http://localhost:8000/api/predictions?incident_id=${inc.id}`);
              if (pRes.ok) {
                const pData = await pRes.json();
                preds.push(...pData);
              }
            } catch (e) {}
          }
          setPredictions(preds);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling for prototype instead of WS
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  const sortedIncidents = [...incidents].sort((a, b) => (b.cashout_probability || 0) - (a.cashout_probability || 0));

  // Dummy sparkline data for prototype
  const sparklineData = Array.from({length: 10}, () => ({ value: Math.random() * 100 }));

  return (
    <div className="p-4 flex flex-col h-full gap-4 relative">
      {/* ROW 1: KPIs */}
      <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
        <KPICard title="Live Event Rate" value={stats?.events_per_second || '24.5'} suffix="/sec" icon={Activity} color="text-cyan-400" trend="+2.4%" />
        <KPICard title="Active Incidents" value={stats?.active_incidents || sortedIncidents.length || 0} icon={AlertTriangle} color="text-rose-400" />
        <KPICard title="Critical Incidents" value={sortedIncidents.filter(i => i.risk_level === 'HIGH').length || 0} icon={Zap} color="text-rose-500" />
        <KPICard title="Amount at Risk" value={formatCurrency(stats?.amount_at_risk || 45000000)} icon={TrendingUp} color="text-amber-400" />
        <KPICard title="Avg Lead Time" value={stats?.avg_lead_time_minutes || '45'} suffix="m" icon={Clock} color="text-emerald-400" />
        <KPICard title="Top-5 Hit Rate" value={((stats?.precision_at_5 || 0.85) * 100).toFixed(1)} suffix="%" icon={Target} color="text-cyan-400" />
      </div>

      {/* ROW 2: Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
            <h2 className="font-semibold text-white">Strategic Map</h2>
            <span className="text-xs text-slate-400">Showing predictive clusters</span>
          </div>
          <div className="flex-1 relative">
            <MapComponent incidents={incidents} predictions={predictions} />
          </div>
        </div>

        <div className="w-[360px] bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col">
          <div className="p-3 border-b border-slate-700/50 bg-slate-900/50">
            <h2 className="font-semibold text-white">Priority Incident Queue</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="text-center p-4 text-slate-500">Loading queue...</div>
            ) : sortedIncidents.length === 0 ? (
              <div className="text-center p-4 text-slate-500">No active incidents</div>
            ) : (
              sortedIncidents.map(inc => (
                <Link key={inc.id} href="/incidents" className="block bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-cyan-400">{inc.id.substring(0,8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      inc.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                      inc.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>{inc.risk_level}</span>
                  </div>
                  <div className="text-sm text-white mb-2">{inc.incident_type ? inc.incident_type.replace('_', ' ') : 'UNKNOWN'}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Prob: <span className="text-white font-mono">{(inc.cashout_probability * 100).toFixed(0)}%</span></span>
                    <span className="text-slate-400">Amt: <span className="text-white font-mono">{formatCurrency(inc.amount_at_risk)}</span></span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Funnel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 shrink-0 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-400 w-full">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white font-mono text-lg">{stats?.events_processed || '1,204,500'}</span>
            <span>Raw Events/sec</span>
          </div>
          <div className="text-slate-600">→</div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white font-mono text-lg">{stats?.automated_analysis || '4,502'}</span>
            <span>Automated Analysis</span>
          </div>
          <div className="text-slate-600">→</div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-white font-mono text-lg">{incidents.length}</span>
            <span>Incident Correlation</span>
          </div>
          <div className="text-slate-600">→</div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-rose-400 font-mono text-lg">{sortedIncidents.filter(i => i.severity === 'critical').length}</span>
            <span className="text-rose-400/80">Human Attention</span>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="absolute bottom-6 right-6 bg-slate-900 border border-slate-700 rounded-full shadow-lg shadow-black/50 p-2 flex items-center gap-4 z-50">
        <div className="px-3 font-mono text-xs text-cyan-400 border-r border-slate-700">
          {simulation?.simulation_time ? new Date(simulation.simulation_time).toISOString().replace('T', ' ').substring(0, 19) : '2025-03-01 14:00:00'}
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => fetch('http://localhost:8000/api/simulation/reset', {method:'POST'}).then(fetchData)} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"><RotateCcw size={16} /></button>
          {simulation?.status === 'RUNNING' ? (
            <button onClick={() => fetch('http://localhost:8000/api/simulation/pause', {method:'POST'}).then(fetchData)} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"><Pause size={16} /></button>
          ) : (
            <button onClick={() => fetch('http://localhost:8000/api/simulation/start', {method:'POST'}).then(fetchData)} className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-full text-cyan-400 transition-colors"><Play size={16} fill="currentColor" /></button>
          )}
          <select 
            value={simulation?.speed || 1}
            onChange={(e) => {
              fetch(`http://localhost:8000/api/simulation/speed?speed=${e.target.value}`, {method:'POST'}).then(fetchData);
            }}
            className="bg-slate-800 text-xs text-white border-none rounded px-2 py-1 ml-2 outline-none">
            <option value="1">1x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="20">20x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, suffix = '', icon: Icon, color, trend }: any) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 min-w-[200px] flex-1">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        <Icon size={16} className={color} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
        <span className="text-sm text-slate-500 font-mono">{suffix}</span>
      </div>
      {trend && (
        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
          <span>{trend}</span>
          <span className="text-slate-500">vs last hour</span>
        </div>
      )}
    </div>
  );
}
