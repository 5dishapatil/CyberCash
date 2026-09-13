'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, ShieldAlert, AlertTriangle, Target, Clock, Radio, ShieldCheck, Map as MapIcon, Play } from 'lucide-react';

const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

export default function CommandCentre() {
  const [incidents, setIncidents] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  
  // Synthetic background throughput state
  const [throughput, setThroughput] = useState(3284);
  const [correlated, setCorrelated] = useState(418);

  const fetchState = () => {
    fetch('http://localhost:8000/api/incidents')
      .then(res => res.json())
      .then(data => {
         setIncidents(data);
         if (data.length > 0) {
            Promise.all(data.map(inc => fetch('http://localhost:8000/api/predictions/' + inc.id).then(r => r.json())))
              .then(results => {
                 const allPreds = results.flat();
                 setPredictions(allPreds);
              });
         }
      });
  };

  useEffect(() => {
    fetchState();
    const ws = new WebSocket('ws://localhost:8000/api/ws');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'EVENT') {
         setThroughput(prev => prev + Math.floor(Math.random() * 5));
         if (Math.random() > 0.95) setCorrelated(prev => prev + 1);
      }
      if (msg.type === 'ALERT') fetchState();
    };
    
    // Simulate live dashboard feeling
    const interval = setInterval(() => {
       setThroughput(prev => prev + Math.floor(Math.random() * 10 - 2));
    }, 1000);
    
    return () => { ws.close(); clearInterval(interval); };
  }, []);

  const handleAction = async (endpoint: string) => {
    await fetch('http://localhost:8000/api/simulation/' + endpoint, { method: 'POST' });
  };

  const criticalCount = predictions.filter(p => p.cashout_probability > 0.8).length;

  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden selection:bg-cyan-900">
      
      {/* LEFT PANEL - NATIONAL STRATEGY & QUEUE */}
      <div className="w-[380px] flex flex-col border-r border-slate-800 bg-[#0f172a] shadow-xl z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center space-x-3 mb-1">
            <ShieldAlert className="text-cyan-500" size={24} />
            <h1 className="text-lg font-bold text-white tracking-widest uppercase">I4C Command</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest">NATIONAL PREDICTIVE INTELLIGENCE</p>
        </div>

        {/* Global Stats */}
        <div className="p-5 border-b border-slate-800 grid grid-cols-2 gap-4 bg-slate-900/50">
           <div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Raw Events</div>
             <div className="text-xl font-mono text-cyan-400">{throughput.toLocaleString()}<span className="text-[10px] text-slate-600">/sec</span></div>
           </div>
           <div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Correlated</div>
             <div className="text-xl font-mono text-slate-300">{correlated.toLocaleString()}</div>
           </div>
           <div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Active Incidents</div>
             <div className="text-xl font-mono text-amber-500">{incidents.length}</div>
           </div>
           <div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Critical Threats</div>
             <div className="text-xl font-mono text-rose-500 animate-pulse">{criticalCount}</div>
           </div>
        </div>

        {/* Action Panel */}
        <div className="p-4 border-b border-slate-800">
          <button onClick={() => handleAction('fraud')} className="w-full flex items-center justify-center space-x-2 p-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-600/40 transition">
            <Play size={14}/> <span className="text-xs font-bold uppercase tracking-wider">Run Demo Scenario</span>
          </button>
        </div>

        {/* Incident Queue */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Prioritized Queue</h2>
          {incidents.map((inc: any) => {
            const p = predictions.find(pr => pr.incident_id === inc.id);
            if(!p) return null;
            const isCritical = p.cashout_probability > 0.8;
            const isActive = activeIncident?.id === inc.id;
            
            return (
              <div 
                key={inc.id} 
                onClick={() => setActiveIncident(isActive ? null : inc)}
                className={p-3 rounded border cursor-pointer transition-all }
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={ont-mono text-[10px] px-1.5 py-0.5 rounded }>
                    {inc.id.substring(0,8)}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">?{inc.amount_at_risk.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm font-bold text-slate-200">{inc.incident_type.replace('_', ' ')}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Assigned: {inc.status}</div>
                  </div>
                  <div className="text-right">
                    <div className={	ext-lg font-bold font-mono }>{(p.cashout_probability * 100).toFixed(0)}%</div>
                    <div className="text-[9px] text-slate-500 uppercase">Cashout Prob</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* System Health */}
        <div className="p-3 border-t border-slate-800 bg-[#0f172a] text-[9px] font-mono text-slate-500 uppercase tracking-widest flex justify-between">
          <span>Ingest: <span className="text-emerald-500">OK</span></span>
          <span>Predictor: <span className="text-emerald-500">OK</span></span>
          <span>Spatial: <span className="text-emerald-500">OK</span></span>
        </div>
      </div>

      {/* RIGHT PANEL - MAP & INCIDENT COMMAND */}
      <div className="flex-1 flex flex-col relative bg-black">
        
        {/* Top Floating Overlay (Level 2/3 Status) */}
        <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none flex justify-between">
           <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md px-4 py-2 rounded shadow-2xl pointer-events-auto flex items-center space-x-3">
              <MapIcon size={16} className="text-cyan-500"/>
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                {activeIncident ? 'Level 3: Incident Command' : 'Level 2: Regional Operations'}
              </span>
           </div>
           
           {activeIncident && (
             <div className="bg-rose-950/90 border border-rose-500/30 backdrop-blur-md px-4 py-2 rounded shadow-2xl pointer-events-auto flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-rose-400"/>
                  <span className="text-xs font-mono text-rose-200">URGENT: CASHOUT WINDOW OPEN</span>
                </div>
             </div>
           )}
        </div>

        {/* Map */}
        <div className="flex-1 z-0">
          <MapComponent activeIncident={activeIncident} predictions={predictions} showInfrastructure={false} />
        </div>

        {/* Bottom Panel - Incident Drill Down */}
        {activeIncident && (
          <div className="absolute bottom-4 left-4 right-4 z-[400] bg-slate-900/95 border border-slate-700 shadow-2xl rounded-lg backdrop-blur-xl flex flex-col max-h-[300px]">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <Target className="text-rose-500" size={18}/>
                <h2 className="font-bold text-white tracking-widest">INCIDENT COMMAND: {activeIncident.id}</h2>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded transition">
                  Acknowledge
                </button>
                <button className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded transition">
                  Escalate to LEA
                </button>
              </div>
            </div>
            
            {predictions.filter(p => p.incident_id === activeIncident.id).map(p => (
              <div key={p.id} className="flex-1 p-4 grid grid-cols-3 gap-6 overflow-y-auto">
                {/* Col 1: Intelligence */}
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Calibrated Target Prediction</div>
                    <div className="text-2xl font-mono text-rose-500 font-bold">{(p.cashout_probability * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400 mt-1">P(Cashout within 30m | Current State)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Spatial Resolution</div>
                    <div className={	ext-sm font-bold }>
                      {p.top_k_terminals?.length > 0 ? 'Terminals Identified' : 'ABSTENTION: Region Only'}
                    </div>
                  </div>
                </div>
                
                {/* Col 2: Evidence */}
                <div className="col-span-2 border-l border-slate-800 pl-6">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center space-x-2">
                    <Radio size={12}/> <span>Automated Evidence Trace</span>
                  </div>
                  <div className="space-y-2">
                    {p.explanations.map((ex: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300 font-mono">
                        {ex.reason}
                      </div>
                    ))}
                  </div>
                  
                  {p.top_k_terminals?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Top Candidate ATMs</div>
                      <div className="grid grid-cols-2 gap-2">
                        {p.top_k_terminals.slice(0,4).map((tk: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-800/80 rounded border border-slate-700 flex justify-between items-center">
                            <span className="font-mono text-xs text-white">{tk.terminal_id}</span>
                            <span className="font-mono text-[10px] text-amber-400">Score: {(tk.prob*100).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
