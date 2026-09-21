'use client';
import { useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Filter, Loader, X, MapPin, Building2, Clock, Hash, ShieldAlert, Activity, Wrench, Camera } from 'lucide-react';

export default function NetworkAnalysis() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [terminals, setTerminals] = useState<any[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<any | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/terminals')
      .then(r => r.json())
      .then(data => setTerminals(data))
      .catch(console.error);

    const fetchGlobalNetwork = async () => {
      try {
        const incRes = await fetch('http://localhost:8000/api/incidents');
        const incidents = await incRes.json();
        
        // Take top 5 incidents to build a macro graph
        const activeIncs = incidents.filter((i:any) => i.active).slice(0, 5);
        
        const allNodes = new Map();
        const allEdges = new Map();
        
        for (let i = 0; i < activeIncs.length; i++) {
          const inc = activeIncs[i];
          const graphRes = await fetch(`http://localhost:8000/api/incidents/${inc.id}/graph`);
          if (!graphRes.ok) continue;
          const graph = await graphRes.json();
          
          graph.nodes.forEach((n: any, idx: number) => {
            if (!allNodes.has(n.id)) {
              allNodes.set(n.id, {
                id: n.id,
                position: { x: (allNodes.size % 8) * 150 + 100, y: Math.floor(allNodes.size / 8) * 150 + (i*100) },
                data: { label: `${n.type.toUpperCase()}: ${n.id.substring(0,6)}`, originalType: n.type },
                style: { 
                  background: n.type === 'terminal' ? '#1e1b4b' : '#1e293b', 
                  color: n.risk === 'HIGH' || n.risk === 'TARGET' ? '#f43f5e' : '#38bdf8',
                  border: `2px solid ${n.risk === 'HIGH' || n.risk === 'TARGET' ? '#be123c' : '#0369a1'}`,
                  borderRadius: n.type === 'terminal' ? '8px' : '50%',
                  padding: '10px',
                  width: 120,
                  fontSize: '10px',
                  textAlign: 'center' as const,
                  cursor: n.type === 'terminal' ? 'pointer' : 'default',
                  boxShadow: n.type === 'terminal' ? '0 0 10px rgba(190, 18, 60, 0.2)' : 'none'
                }
              });
            }
          });
          
          graph.edges.forEach((e: any) => {
            if (!allEdges.has(e.id)) {
              allEdges.set(e.id, {
                id: e.id,
                source: e.source,
                target: e.target,
                animated: true,
                label: e.label,
                style: { stroke: '#ec4899', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#ec4899' }
              });
            }
          });
        }
        
        setNodes(Array.from(allNodes.values()));
        setEdges(Array.from(allEdges.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGlobalNetwork();
  }, []);

  const onNodeClick = (_: any, node: Node) => {
    if (node.data?.originalType === 'terminal') {
      const term = terminals.find(t => t.id === node.id);
      setSelectedTerminal(term || { id: node.id, error: 'Details not found' });
    } else {
      setSelectedTerminal(null);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch className="text-cyan-400" />
            Global Fraud Network
          </h1>
          <p className="text-slate-400 mt-1">Cross-correlating entities across all active incidents. Click on a Terminal node for details.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition">
          <Filter size={16} /> Filter Graph
        </button>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 relative flex">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400 flex-col gap-4 z-10 bg-slate-900">
            <Loader size={32} className="animate-spin" />
            <p>Correlating macro-network topology...</p>
          </div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={onNodeClick}>
            <Background color="#1e293b" />
            <Controls className="bg-slate-800 fill-white border-slate-700" />
          </ReactFlow>
        )}

        {/* TERMINAL DETAILS PANEL */}
        {selectedTerminal && (
          <div className="absolute top-4 right-4 w-80 bg-slate-800/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 z-50">
            <div className="flex justify-between items-center bg-slate-900 p-4 border-b border-slate-700">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ShieldAlert className="text-rose-400" size={18} />
                ATM Terminal Profile
              </h3>
              <button onClick={() => setSelectedTerminal(null)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {selectedTerminal.error ? (
                <div className="text-slate-400 text-sm">{selectedTerminal.error}</div>
              ) : (
                <>
                  <div className="flex items-start gap-3 text-sm">
                    <Hash className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <div className="text-slate-400 text-xs uppercase tracking-wider">Terminal ID</div>
                      <div className="text-white font-mono">{selectedTerminal.id}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Building2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <div className="text-slate-400 text-xs uppercase tracking-wider">Managing Bank / Custodian</div>
                      <div className="text-white font-medium">{selectedTerminal.bank_id} ({selectedTerminal.terminal_type})</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="text-rose-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <div className="text-slate-400 text-xs uppercase tracking-wider">Location / Neighborhood</div>
                      <div className="text-white">{selectedTerminal.synthetic_neighborhood || 'Unknown Sector'}</div>
                      <div className="text-slate-500 text-xs font-mono mt-1">Lat: {selectedTerminal.latitude?.toFixed(4)}, Lon: {selectedTerminal.longitude?.toFixed(4)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="text-amber-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <div className="text-slate-400 text-xs uppercase tracking-wider">Historical Usage</div>
                      <div className="text-white">{selectedTerminal.historical_usage?.toLocaleString()} total transactions logged</div>
                    </div>
                  </div>

                  {(() => {
                    // Generate deterministic random-looking data based on terminal ID
                    const hash = selectedTerminal.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const cashLevel = 20 + (hash % 70); // 20% to 90%
                    const statuses = ["Active / Online", "Active / Online", "Active / Online", "Maintenance Mode", "Offline"];
                    const status = statuses[hash % statuses.length];
                    const cameraStatus = hash % 3 === 0 ? "Degraded (Flagged)" : "Operational (1080p)";
                    const lastServicedDays = (hash % 14) + 1;
                    
                    return (
                      <>
                        <div className="w-full h-px bg-slate-700 my-1"></div>
                        
                        <div className="flex items-start gap-3 text-sm">
                          <Activity className="text-purple-400 shrink-0 mt-0.5" size={16} />
                          <div className="w-full">
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Vault Cash Level</div>
                            <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                              <div className={`h-2 rounded-full ${cashLevel < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${cashLevel}%` }}></div>
                            </div>
                            <div className="text-white text-xs">{cashLevel}% Capacity</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm">
                          <Wrench className="text-orange-400 shrink-0 mt-0.5" size={16} />
                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider">Hardware Status</div>
                            <div className="text-white flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${status.includes('Active') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              {status}
                            </div>
                            <div className="text-slate-500 text-xs mt-1">Last serviced: {lastServicedDays} days ago</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 text-sm">
                          <Camera className="text-blue-400 shrink-0 mt-0.5" size={16} />
                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider">CCTV Feed Status</div>
                            <div className="text-white">{cameraStatus}</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
