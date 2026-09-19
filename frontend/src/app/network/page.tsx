'use client';
import { ReactFlow, Controls, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Filter } from 'lucide-react';

const initialNodes: Node[] = [
  { id: 'term-1', position: { x: 250, y: 100 }, data: { label: 'Terminal A' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
  { id: 'card-1', position: { x: 100, y: 200 }, data: { label: 'Card ending 4912' }, style: { background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '50%' } },
  { id: 'card-2', position: { x: 400, y: 200 }, data: { label: 'Card ending 8810' }, style: { background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '50%' } },
  { id: 'term-2', position: { x: 250, y: 300 }, data: { label: 'Terminal B' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'card-1', target: 'term-1', animated: true, style: { stroke: '#ec4899' } },
  { id: 'e2', source: 'card-2', target: 'term-1', animated: true, style: { stroke: '#ec4899' } },
  { id: 'e3', source: 'card-1', target: 'term-2', animated: true, style: { stroke: '#06b6d4' } },
];

export default function NetworkAnalysis() {
  return (
    <div className="flex h-full flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitBranch className="text-cyan-400" />
          Network Analysis
        </h1>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white">
          <Filter size={16} /> Filters
        </button>
      </div>
      
      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
        <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
          <Background color="#334155" />
          <Controls className="bg-slate-800 fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
