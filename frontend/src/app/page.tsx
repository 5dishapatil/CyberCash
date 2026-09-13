'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, FastForward, AlertTriangle } from 'lucide-react';

const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

export default function Home() {
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/terminals')
      .then(res => res.json())
      .then(data => setTerminals(data));

    fetch('http://localhost:8000/api/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data));

    const ws = new WebSocket('ws://localhost:8000/api/ws');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'EVENT') {
        setEvents(prev => [msg.data, ...prev].slice(0, 50));
      } else if (msg.type === 'ALERT') {
        fetch('http://localhost:8000/api/incidents')
          .then(res => res.json())
          .then(data => setIncidents(data));
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
            <AlertTriangle size={16}/> <span>Inject Fraud Cascade</span>
          </button>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-lg font-semibold text-rose-400 mb-2">High Risk Incidents</h2>
          <div className="space-y-2">
            {incidents.length === 0 && <p className="text-slate-400 text-sm">No incidents detected.</p>}
            {incidents.map((inc: any) => (
              <div key={inc.id} className="p-3 bg-slate-700 border border-rose-500 rounded">
                <div className="flex justify-between">
                  <span className="font-mono text-sm">{inc.id}</span>
                  <span className="text-rose-400 font-bold"></span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Source: {inc.trigger_source}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold text-slate-300 mb-2">Live Transaction Feed</h2>
          <div className="flex-1 overflow-y-auto space-y-1">
            {events.map((ev: any, i: number) => (
              <div key={i} className={	ext-xs p-2 rounded flex justify-between {ev.risk === 'HIGH' ? 'bg-rose-900/50 text-rose-200' : 'bg-slate-700 text-slate-300'}}>
                <span>{ev.source} &rarr; {ev.destination}</span>
                <span className="font-mono"></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main - Map */}
      <div className="w-2/3 h-full bg-slate-950 relative">
        <MapComponent terminals={terminals} incidents={incidents} />
      </div>
    </div>
  );
}
