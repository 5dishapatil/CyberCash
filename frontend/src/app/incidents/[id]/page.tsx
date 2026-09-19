'use client';
import { useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Clock, ShieldAlert, CheckCircle, Activity, Map as MapIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'Suspicious Terminal 402' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Card Compromise Event' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
  { id: '3', position: { x: 400, y: 100 }, data: { label: 'High Velocity Withdrawals' }, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } },
];
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#ec4899' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#06b6d4' } },
];

const mockPredictionData = [
  { time: '10:00', prob: 20 },
  { time: '10:15', prob: 45 },
  { time: '10:30', prob: 78 },
  { time: '10:45', prob: 92 },
  { time: '11:00', prob: 95 },
];

export default function IncidentWorkspace() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500" />
            Incident Workspace: {id}
          </h1>
          <p className="text-slate-400">Critical priority - Cashout probability 95%</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors">
            Dispatch Response
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors">
            Close Incident
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 mb-2">
        {['overview', 'network', 'predictions', 'timeline', 'evidence', 'audit'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium uppercase tracking-wider ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 relative">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-4 h-full">
            <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
               <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><MapIcon size={18}/> Threat Map</h3>
               <div className="w-full h-80 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500">
                  Interactive Map Component
               </div>
            </div>
            <div className="col-span-1 flex flex-col gap-4">
               <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Key Entities</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-400">Terminals</span><span className="text-white font-mono">2</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Cards</span><span className="text-white font-mono">14</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Risk Value</span><span className="text-amber-400 font-mono">₹45.2 L</span></li>
                  </ul>
               </div>
            </div>
          </div>
        )}
        
        {activeTab === 'network' && (
          <div className="w-full h-full bg-slate-900 rounded-xl border border-slate-700">
            <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
              <Background color="#334155" />
              <Controls className="bg-slate-800 fill-white" />
            </ReactFlow>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="w-full h-full bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Cashout Probability Trajectory</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPredictionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                  <Line type="monotone" dataKey="prob" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Other tabs can be stubs */}
        {['timeline', 'evidence', 'audit'].includes(activeTab) && (
          <div className="flex items-center justify-center h-full text-slate-500">
             Module loaded. Data syncing...
          </div>
        )}
      </div>
    </div>
  );
}
