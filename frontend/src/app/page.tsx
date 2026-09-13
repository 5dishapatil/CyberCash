'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, AlertTriangle, ShieldAlert } from 'lucide-react';

const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

export default function Home() {
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fetchState = () => {
    fetch('http://localhost:8000/api/incidents')
      .then(res => res.json())
      .then(data => {
         setIncidents(data);
         if (data.length > 0) {
            fetch('http://localhost:8000/api/predictions/' + data[0].id)
              .then(res => res.json())
              .then(pData => setPredictions(pData));
         }
      });
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/terminals').then(res => res.json()).then(data => setTerminals(data));
    fetchState();

    const ws = new WebSocket('ws://localhost:8000/api/ws');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'EVENT') setEvents(prev => [msg.data, ...prev].slice(0, 50));
      else if (msg.type === 'ALERT') fetchState();
    };
    return () => ws.close();
  }, []);

  const handleAction = async (endpoint: string) => {
    await fetch('http://localhost:8000/api/simulation/' + endpoint, { method: 'POST' });
    if (endpoint === 'start') setIsPlaying(true);
    if (endpoint === 'pause') setIsPlaying(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-[400px] flex flex-col border-r border-slate-700 bg-slate-800 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-cyan-400 tracking-tight">CYBERCASH SENTINEL</h1>
        
        {/* Controls */}
        <div className="bg-slate-700 p-3 rounded flex space-x-2">
          <button onClick={() => handleAction('start')} disabled={isPlaying} className="p-1.5 bg-emerald-600 rounded disabled:opacity-50"><Play size={18}/></button>
          <button onClick={() => handleAction('pause')} disabled={!isPlaying} className="p-1.5 bg-rose-600 rounded disabled:opacity-50"><Pause size={18}/></button>
          <button onClick={() => handleAction('fraud')} className="flex items-center space-x-2 p-1.5 bg-purple-600 rounded hover:bg-purple-500 transition ml-auto">
            <AlertTriangle size={14}/> <span className="text-xs font-bold uppercase">Run Scenario: Cascade</span>
          </button>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Active Intelligence</h2>
          <div className="space-y-2">
            {incidents.length === 0 && <p className="text-slate-500 text-xs">No incidents.</p>}
            {incidents.map((inc: any) => {
              const p = predictions.find(pr => pr.incident_id === inc.id);
              const hasTerminal = p && p.top_k_terminals && p.top_k_terminals.length > 0;
              
              return (
                <div key={inc.id} className="p-3 bg-slate-900 border-l-4 border-rose-500 rounded shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500">{inc.id}</span>
                      <h3 className="font-bold text-sm text-rose-400">{inc.incident_type}</h3>
                    </div>
                    <span className="text-rose-400 font-bold font-mono text-sm">?{inc.amount_at_risk}</span>
                  </div>
                  
                  {p && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-1.5 bg-slate-800 rounded">
                        <span className="text-slate-400">P(Cashout | State)</span>
                        <span className="text-rose-400 font-bold font-mono">{(p.cashout_probability * 100).toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex justify-between p-1.5 bg-slate-800 rounded">
                        <span className="text-slate-400">Spatial Confidence</span>
                        <span className={hasTerminal ? "text-amber-400 font-bold" : "text-rose-500 font-bold"}>
                          {hasTerminal ? "HIGH (Terminal)" : "LOW (Region Only)"}
                        </span>
                      </div>
                      
                      {!hasTerminal && (
                         <div className="p-2 border border-dashed border-rose-500/50 bg-rose-950/20 text-rose-300 rounded flex items-center space-x-2">
                           <ShieldAlert size={14} />
                           <span>Model Abstention: Insufficient terminal confidence.</span>
                         </div>
                      )}
                      
                      <div className="p-2 bg-slate-800 rounded text-slate-300 border border-slate-700">
                        <strong className="text-slate-400 block mb-1">Causal Evidence:</strong>
                        <ul className="list-disc pl-4 space-y-1">
                          {p.explanations.map((ex, idx) => <li key={idx}>{ex.reason}</li>)}
                        </ul>
                      </div>
                      
                      <button className="w-full py-1.5 mt-2 bg-cyan-900/50 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded font-bold uppercase text-[10px] tracking-wider">
                        {p.recommended_action}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Event Stream</h2>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {events.map((ev: any, i: number) => (
              <div key={i} className={`text-[10px] p-1.5 rounded flex justify-between items-center ${ev.risk === 'HIGH' ? 'bg-rose-900/40 text-rose-300 border border-rose-800/50' : 'bg-slate-800/50 text-slate-400'}`}>
                <span className="font-mono">{ev.source} &rarr; {ev.destination}</span>
                <span className="font-mono">₹{ev.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main - Map */}
      <div className="flex-1 h-full bg-slate-950 relative">
        <MapComponent terminals={terminals} incidents={incidents} predictions={predictions} />
      </div>
    </div>
  );
}
