'use client';
import { Layers } from 'lucide-react';
import { ReactFlow, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodes: Node[] = [
  { id: '1', position: { x: 50, y: 150 }, data: { label: 'Card Transactions (Kafka)' }, style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } },
  { id: '2', position: { x: 300, y: 50 }, data: { label: 'Graph DB (Neo4j/Redis)' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
  { id: '3', position: { x: 300, y: 250 }, data: { label: 'Temporal Feature Store' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
  { id: '4', position: { x: 550, y: 150 }, data: { label: 'T-GNN Model Inference' }, style: { background: '#312e81', color: '#fff', border: '1px solid #4f46e5' } },
  { id: '5', position: { x: 800, y: 150 }, data: { label: 'Command Centre Dashboard' }, style: { background: '#083344', color: '#fff', border: '1px solid #06b6d4' } },
];

const edges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#94a3b8' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#06b6d4' } },
];

export default function Architecture() {
  return (
    <div className="flex h-full flex-col p-6 gap-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="text-cyan-400" />
          Intelligence Pipeline Architecture
        </h1>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 text-sm text-slate-400 bg-slate-800/80 p-2 rounded border border-slate-700">
          Data flows from raw transaction ingestion through feature generation to GNN prediction and UI broadcast.
        </div>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#334155" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
