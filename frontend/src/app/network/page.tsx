'use client';
import { useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Filter, Loader } from 'lucide-react';

export default function NetworkAnalysis() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
                data: { label: `${n.type.toUpperCase()}: ${n.id.substring(0,6)}` },
                style: { 
                  background: n.type === 'terminal' ? '#0f172a' : '#1e293b', 
                  color: n.risk === 'HIGH' || n.risk === 'TARGET' ? '#f43f5e' : '#38bdf8',
                  border: `1px solid ${n.risk === 'HIGH' || n.risk === 'TARGET' ? '#be123c' : '#0369a1'}`,
                  borderRadius: n.type === 'terminal' ? '4px' : '50%',
                  padding: '10px',
                  width: 120,
                  fontSize: '10px',
                  textAlign: 'center' as const
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

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch className="text-cyan-400" />
            Global Fraud Network
          </h1>
          <p className="text-slate-400 mt-1">Cross-correlating entities across all active incidents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition">
          <Filter size={16} /> Filter Graph
        </button>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400 flex-col gap-4">
            <Loader size={32} className="animate-spin" />
            <p>Correlating macro-network topology...</p>
          </div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background color="#334155" />
            <Controls className="bg-slate-800 fill-white" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
