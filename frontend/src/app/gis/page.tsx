'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Map, Layers, Filter, RefreshCw } from 'lucide-react';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

const INCIDENT_TYPES = ['ALL', 'MULE_CASCADE', 'RAPID_CASHOUT', 'ATM_SWITCHING', 'GEO_SWITCHING', 'AMOUNT_SPLITTING', 'SLEEPER_MULE', 'CROSS_BANK_CASCADE'];
const SEVERITY_LEVELS = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export default function GISIntelligence() {
  const [layers, setLayers] = useState({ terminals: true, incidents: true });
  const [filters, setFilters] = useState({ severity: 'ALL', type: 'ALL', minProb: 0 });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchInfra = useCallback(async () => {
    try {
      const tRes = await fetch('http://localhost:8000/api/terminals');
      if (tRes.ok) setTerminals(await tRes.json());
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const incRes = await fetch('http://localhost:8000/api/incidents');
      if (!incRes.ok) return;
      const allInc = await incRes.json();

      // Apply filters
      let filtered = allInc.filter((i: any) => i.active);
      if (filters.severity !== 'ALL') filtered = filtered.filter((i: any) => i.risk_level === filters.severity);
      if (filters.type !== 'ALL') filtered = filtered.filter((i: any) => i.incident_type === filters.type);
      if (filters.minProb > 0) filtered = filtered.filter((i: any) => (i.cashout_probability || 0) >= filters.minProb / 100);

      setIncidents(filtered);

      if (filtered.length > 0) {
        const predResults = await Promise.allSettled(
          filtered.slice(0, 10).map((inc: any) =>
            fetch(`http://localhost:8000/api/predictions/${inc.id}`).then(r => r.ok ? r.json() : [])
          )
        );
        const allPreds = predResults
          .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
          .flatMap(r => r.value);
        setPredictions(allPreds);
      } else {
        setPredictions([]);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchInfra(); }, [fetchInfra]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const riskCounts = {
    HIGH: incidents.filter(i => i.risk_level === 'HIGH').length,
    MEDIUM: incidents.filter(i => i.risk_level === 'MEDIUM').length,
    LOW: incidents.filter(i => i.risk_level === 'LOW').length,
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map className="text-cyan-400" />
          GIS Intelligence
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Last update: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchData} className="p-1.5 rounded hover:bg-slate-700 transition">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-rose-400 font-bold">{riskCounts.HIGH}</span>
          <span className="text-slate-400 ml-1">HIGH</span>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-amber-400 font-bold">{riskCounts.MEDIUM}</span>
          <span className="text-slate-400 ml-1">MEDIUM</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-emerald-400 font-bold">{riskCounts.LOW}</span>
          <span className="text-slate-400 ml-1">LOW</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-white font-bold">{terminals.length}</span>
          <span className="text-slate-400 ml-1">ATMs</span>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden relative min-h-0">
        {/* Left Filter Panel */}
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 border border-slate-700 p-4 rounded-xl flex flex-col gap-4 shadow-lg backdrop-blur-sm w-52">
          <div>
            <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers size={14} className="text-cyan-400" /> Map Layers
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input type="checkbox" checked={layers.terminals} onChange={e => setLayers({...layers, terminals: e.target.checked})} className="accent-cyan-500 w-3.5 h-3.5" />
                ATM Infrastructure
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input type="checkbox" checked={layers.incidents} onChange={e => setLayers({...layers, incidents: e.target.checked})} className="accent-rose-500 w-3.5 h-3.5" />
                Active Threats
              </label>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Filter size={14} className="text-amber-400" /> Filters
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Severity</label>
                <select
                  value={filters.severity}
                  onChange={e => setFilters({...filters, severity: e.target.value})}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Incident Type</label>
                <select
                  value={filters.type}
                  onChange={e => setFilters({...filters, type: e.target.value})}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Min Probability: {filters.minProb}%
                </label>
                <input
                  type="range"
                  min={0} max={90} step={5}
                  value={filters.minProb}
                  onChange={e => setFilters({...filters, minProb: Number(e.target.value)})}
                  className="w-full mt-1 accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-slate-400">High Risk (&gt;60% prob)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-slate-400">Medium Risk (30-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0"></span>
                <span className="text-slate-400">ATM Infrastructure</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-full bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-slate-500 mb-2">Loading Geospatial Intelligence...</div>
                <div className="w-48 h-1 bg-slate-800 rounded mx-auto overflow-hidden">
                  <div className="h-full bg-cyan-500 animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          ) : (
            <MapComponent
              incidents={layers.incidents ? incidents : []}
              predictions={layers.incidents ? predictions : []}
              terminals={layers.terminals ? terminals : []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
