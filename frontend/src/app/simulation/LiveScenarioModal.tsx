'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Play, Loader2, Activity, Map as MapIcon, Network } from 'lucide-react';
import { ReactFlow, Background, Controls, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

import 'leaflet/dist/leaflet.css';

interface Props {
  scenarioId: number;
  scenarioName: string;
  onClose: () => void;
}

export default function LiveScenarioModal({ scenarioId, scenarioName, onClose }: Props) {
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  
  const [fullNodes, setFullNodes] = useState<any[]>([]);
  const [fullEdges, setFullEdges] = useState<any[]>([]);
  
  const [visibleNodes, setVisibleNodes] = useState<Node[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [predictedAtm, setPredictedAtm] = useState<any>(null);

  useEffect(() => {
    // 1. Trigger Scenario
    fetch(`http://localhost:8000/api/simulation/scenario/${scenarioId}`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setIncidentId(data.incident_id);
      })
      .catch(console.error);
  }, [scenarioId]);

  useEffect(() => {
    if (!incidentId) return;

    // 2. Fetch Graph Data
    fetch(`http://localhost:8000/api/incidents/${incidentId}/graph`)
      .then(r => r.json())
      .then(data => {
        const _nodes = data.nodes || [];
        const _edges = data.edges || [];
        
        // Arrange nodes roughly
        const nodeLayout = _nodes.map((n: any, i: number) => {
           let x = 100 + (i % 3) * 200;
           let y = 100 + Math.floor(i / 3) * 150;
           return {
             id: n.id,
             position: { x, y },
             data: { label: n.label || n.id },
             style: {
               background: n.type === 'terminal' ? '#1e1b4b' : '#0f172a',
               color: '#e2e8f0',
               border: '1px solid #334155',
               borderRadius: '8px',
               padding: '10px',
               width: 150,
               boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
             }
           };
        });

        const edgeLayout = _edges.map((e: any) => ({
           id: e.id,
           source: e.source,
           target: e.target,
           label: e.label,
           animated: true,
           style: { stroke: '#06b6d4', strokeWidth: 2 },
           markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        }));

        setFullNodes(nodeLayout);
        setFullEdges(edgeLayout);

        // Fetch ATMS from predictions
        fetch(`http://localhost:8000/api/incidents/${incidentId}`)
          .then(r => r.json())
          .then(inc => {
            const preds = inc.predictions || [];
            if (preds.length > 0) {
              const latest = preds[preds.length - 1];
              setTerminals(latest.top_k_terminals || []);
              if (scenarioId <= 2 || scenarioId === 10) {
                 // Not historical
                 setPredictedAtm(null);
              } else {
                 setPredictedAtm(latest.top_k_terminals?.[0]);
              }
            }
            setLoading(false);
          });
      })
      .catch(console.error);
  }, [incidentId]);

  // Real-time animation loop
  useEffect(() => {
    if (loading || fullEdges.length === 0) return;

    const interval = setInterval(() => {
      setStep(prev => {
        const nextStep = prev + 1;
        
        // Show edges up to nextStep
        const currentEdges = fullEdges.slice(0, nextStep);
        
        // Add glowing effect to the latest edge
        const animatedEdges = currentEdges.map((e, idx) => {
           if (idx === currentEdges.length - 1) {
             return { ...e, style: { stroke: '#f43f5e', strokeWidth: 4, filter: 'drop-shadow(0 0 5px #f43f5e)' } };
           }
           return e;
        });

        // Find all nodes connected by currentEdges
        const connectedNodeIds = new Set<string>();
        currentEdges.forEach(e => {
          connectedNodeIds.add(e.source);
          connectedNodeIds.add(e.target);
        });

        // Also add root nodes if no edges yet
        if (currentEdges.length === 0 && fullNodes.length > 0) {
          connectedNodeIds.add(fullNodes[0].id);
        }

        const currentNodes = fullNodes.filter(n => connectedNodeIds.has(n.id)).map(n => {
           // Highlight next prediction if historical
           if (predictedAtm && n.id === predictedAtm.terminal_id) {
             return {
               ...n,
               style: { ...n.style, border: '2px solid #fbbf24', boxShadow: '0 0 15px rgba(251,191,36,0.5)' },
               data: { label: `${n.data.label} (PREDICTED)` }
             };
           }
           // Highlight newest node
           if (currentEdges.length > 0 && n.id === currentEdges[currentEdges.length-1].target) {
             return { ...n, style: { ...n.style, border: '2px solid #f43f5e' } };
           }
           return n;
        });

        setVisibleEdges(animatedEdges);
        setVisibleNodes(currentNodes);

        if (nextStep > fullEdges.length + 2) {
          clearInterval(interval);
        }
        return nextStep;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, fullEdges, fullNodes, predictedAtm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Activity size={20} className={step <= fullEdges.length ? "animate-pulse" : ""} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Live Execution: {scenarioName}</h2>
              <p className="text-xs text-slate-400 font-mono">INCIDENT_ID: {incidentId || 'GENERATING...'} • T + {step}s</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col lg:flex-row relative">
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="text-cyan-500 animate-spin" />
              <p className="text-slate-400">Initializing scenario sandbox and building dynamic graph...</p>
            </div>
          ) : (
            <>
              {/* LEFT: NETWORK GRAPH */}
              <div className="flex-1 relative border-r border-slate-800 bg-slate-950">
                <div className="absolute top-4 left-4 z-10 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
                  <Network size={16} className="text-cyan-400"/>
                  <span className="text-xs font-semibold text-slate-300">Dynamic Money Flow</span>
                </div>
                
                <ReactFlow 
                  nodes={visibleNodes} 
                  edges={visibleEdges} 
                  fitView 
                  className="bg-slate-950"
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#1e293b" gap={16} />
                  <Controls className="bg-slate-800 border-slate-700 fill-white" />
                </ReactFlow>

                {/* OVERLAY FOR HISTORICAL PREDICTION */}
                {predictedAtm && step > fullEdges.length - 2 && (
                   <div className="absolute bottom-4 left-4 z-10 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-4">
                      <h4 className="text-amber-400 font-bold text-sm mb-1">Historical Pattern Detected</h4>
                      <p className="text-xs text-slate-300">System recognizes behavioral sequence. Next likely cashout terminal highlighted.</p>
                   </div>
                )}
                
                {/* OVERLAY FOR NEW PATTERN */}
                {!predictedAtm && step > 0 && (
                   <div className="absolute bottom-4 left-4 z-10 bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-4">
                      <h4 className="text-cyan-400 font-bold text-sm mb-1">Evolving Pattern (Nodes added on the go)</h4>
                      <p className="text-xs text-slate-300">Live dynamic graph construction as funds transfer through intermediate accounts.</p>
                   </div>
                )}
              </div>

              {/* RIGHT: LIVE MAP */}
              <div className="w-full lg:w-[400px] xl:w-[500px] relative bg-slate-900">
                <div className="absolute top-4 left-4 z-[400] bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
                  <MapIcon size={16} className="text-rose-400"/>
                  <span className="text-xs font-semibold text-slate-300">Geospatial Target Heatmap</span>
                </div>
                
                <MapContainer 
                  center={[18.5204, 73.8567]} 
                  zoom={12} 
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {terminals.map((t: any, idx: number) => {
                     // Red for critical (idx 0), Ochre for medium (idx > 0)
                     const isCritical = idx === 0;
                     const color = isCritical ? '#f43f5e' : '#d97706';
                     return (
                       <CircleMarker
                         key={idx}
                         center={[t.lat, t.lon]}
                         radius={isCritical ? 12 : 8}
                         pathOptions={{
                           color: color,
                           fillColor: color,
                           fillOpacity: isCritical ? 0.6 : 0.4,
                           weight: 2
                         }}
                       >
                         <Popup className="bg-slate-900 text-white border-slate-700">
                           <div className="text-xs font-semibold">{t.terminal_id}</div>
                           <div className="text-xs opacity-80">Prob: {(t.probability * 100).toFixed(1)}%</div>
                         </Popup>
                       </CircleMarker>
                     );
                  })}
                </MapContainer>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
