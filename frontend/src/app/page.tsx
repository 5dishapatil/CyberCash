'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, FastForward, AlertTriangle } from 'lucide-react';

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
            // Fetch predictions for the most recent active incident
            fetch(http://localhost:8000/api/predictions/ + data[0].id)
              .then(res => res.json())
              .then(pData => setPredictions(pData));
         }
      });
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/terminals')
      .then(res => res.json())
      .then(data => setTerminals(data));

    fetchState();

    const ws = new WebSocket('ws://localhost:8000/api/ws');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'EVENT') {
        setEvents(prev => [msg.data, ...prev].slice(0, 50));
      } else if (msg.type === 'ALERT') {
        fetchState();
      }
    };
    return () => ws.close();
  }, []);

  const handleStart = async () => {
    await fetch('http://localhost:8000/api/simulation/start', { method: 'POST' });
    setIsPlaying(true);
  };

  const handlePause = async () => {
    await fetch('http://localhost:8000/api/simulation/pause', { method: 'POST' });
    setIsPlaying(false);
  };

  const handleFraud = async () => {
    await fetch('http://localhost:8000/api/simulation/fraud', { method: 'POST' });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Sidebar - Controls & Events */}
      <div className="w-1/3 flex flex-col border-r border-slate-700 bg-slate-800 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-cyan-400">CyberCash Sentinel</h1>
        
        {/* Controls */}
        <div className="bg-slate-700 p-4 rounded-lg flex space-x-2">
          <button onClick={handleStart} disabled={isPlaying} className="p-2 bg-emerald-600 rounded disabled:opacity-50"><Play size={20}/></button>
          <button onClick={handlePause} disabled={!isPlaying} className="p-2 bg-rose-600 rounded disabled:opacity-50"><Pause size={20}/></button>
          <button onClick={handleFraud} className="flex items-center space-x-2 p-2 bg-purple-600 rounded hover:bg-purple-500 transition ml-auto">
            <AlertTriangle size={16}/> <span className="text-sm font-bold">Inject Fraud Cascade</span>
          </button>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-lg font-semibold text-rose-400 mb-2">Active Intelligence</h2>
          <div className="space-y-2">
            {incidents.length === 0 && <p className="text-slate-400 text-sm">No incidents detected.</p>}
            {incidents.map((inc: any) => (
              <div key={inc.id} className="p-3 bg-slate-800 border-l-4 border-rose-500 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-slate-400">INCIDENT {inc.id}</span>
                    <h3 className="font-bold text-rose-400">{inc.incident_type}</h3>
                  </div>
                  <span className="text-rose-400 font-bold font-mono">?{inc.amount_at_risk}</span>
                </div>
                
                {/* Prediction Details if matching this incident */}
                {predictions.length > 0 && predictions[0].incident_id === inc.id && (
                  <div className="mt-3 p-2 bg-rose-950/50 rounded text-sm border border-rose-900/50">
                     <div className="flex justify-between mb-1">
                       <span className="text-slate-300">Cash-out Probability:</span>
                       <span className="text-rose-400 font-bold">{(predictions[0].cashout_probability * 100).toFixed(1)}%</span>
                     </div>
                     <div className="flex justify-between mb-1">
                       <span className="text-slate-300">Time Window:</span>
                       <span className="text-cyan-400 font-mono">5m - 30m</span>
                     </div>
                     <div className="mt-2 pt-2 border-t border-rose-900/30 text-xs text-slate-400">
                       <strong>Why:</strong> {predictions[0].explanations[0]?.reason}
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          <h2 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Live Transaction Feed</h2>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {events.map((ev: any, i: number) => (
              <div key={i} className={	ext-xs p-2 rounded flex justify-between items-center }>
                <span className="font-mono">{ev.source} &rarr; {ev.destination}</span>
                <span className="font-mono font-bold">?{ev.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main - Map */}
      <div className="w-2/3 h-full bg-slate-950 relative">
        <MapComponent terminals={terminals} incidents={incidents} predictions={predictions} />
      </div>
    </div>
  );
}
