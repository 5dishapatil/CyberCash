'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Map, Layers } from 'lucide-react';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function GISIntelligence() {
  const [layers, setLayers] = useState({ terminals: true, incidents: true });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfra = async () => {
      try {
        const tRes = await fetch('http://localhost:8000/api/terminals');
        setTerminals(await tRes.json());
      } catch(e) {}
    };
    fetchInfra();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incRes = await fetch('http://localhost:8000/api/incidents');
        const incData = await incRes.json();
        setIncidents(incData.filter((i:any) => i.active));
        
        const fullPreds = await Promise.all(
           incData.filter((i:any) => i.active).map((inc:any) => 
             fetch(`http://localhost:8000/api/predictions/${inc.id}`).then(r => r.json())
           )
        );
        setPredictions(fullPreds.flat());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map className="text-cyan-400" />
          GIS Intelligence
        </h1>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col gap-3 shadow-lg backdrop-blur-sm w-48">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Layers size={16} className="text-cyan-400"/> Map Layers</h3>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white transition">
            <input type="checkbox" checked={layers.terminals} onChange={e => setLayers({...layers, terminals: e.target.checked})} className="accent-cyan-500 w-4 h-4" />
            ATM Infrastructure
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white transition">
            <input type="checkbox" checked={layers.incidents} onChange={e => setLayers({...layers, incidents: e.target.checked})} className="accent-rose-500 w-4 h-4" />
            Active Threats
          </label>
        </div>
        <div className="w-full h-full bg-slate-900">
           {loading ? (
             <div className="flex items-center justify-center h-full text-slate-500">Loading Geospatial Data...</div>
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
