'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, Layers, Target, Shield, Wifi } from 'lucide-react';

export default function GISIntelligence() {
  const [layers, setLayers] = useState({ terminals: true, branches: false, incidents: true });
  
  return (
    <div className="flex h-full flex-col p-4 gap-4 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map className="text-cyan-400" />
          GIS Intelligence
        </h1>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-700 p-3 rounded-lg flex flex-col gap-2 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Layers size={14}/> Layers</h3>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={layers.terminals} onChange={e => setLayers({...layers, terminals: e.target.checked})} className="accent-cyan-500" />
            ATM Terminals
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={layers.incidents} onChange={e => setLayers({...layers, incidents: e.target.checked})} className="accent-rose-500" />
            Active Incidents
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={layers.branches} onChange={e => setLayers({...layers, branches: e.target.checked})} className="accent-amber-500" />
            Bank Branches
          </label>
        </div>
        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
           [GIS Map Engine Initializing...]
        </div>
      </div>
    </div>
  );
}
