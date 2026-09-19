'use client';
import { Brain, Activity, Database, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ModelOps() {
  return (
    <div className="flex h-full flex-col p-6 gap-6 relative overflow-y-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-cyan-400" />
            Model Operations
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> MODEL ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">CyberCash GNN V1.0 - Model Card</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><span className="text-slate-500 block mb-1">Architecture</span><span className="text-white">Temporal Graph Neural Network (T-GNN)</span></div>
              <div><span className="text-slate-500 block mb-1">Target</span><span className="text-white">ATM Cashout Prediction</span></div>
              <div><span className="text-slate-500 block mb-1">Last Trained</span><span className="text-white font-mono">2024-10-12 04:22 UTC</span></div>
              <div><span className="text-slate-500 block mb-1">F1 Score (Validation)</span><span className="text-emerald-400 font-mono">0.92</span></div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
             <h2 className="text-lg font-semibold text-white mb-4">Prediction Latency Trace</h2>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={[{time: '12:00', ms: 45}, {time: '12:05', ms: 52}, {time: '12:10', ms: 48}, {time: '12:15', ms: 90}, {time: '12:20', ms: 42}]}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey="time" stroke="#94a3b8" />
                   <YAxis stroke="#94a3b8" />
                   <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                   <Line type="monotone" dataKey="ms" stroke="#8b5cf6" strokeWidth={2} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Database size={18}/> Dataset Details</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col"><span className="text-slate-500">Training Window</span><span className="text-white font-mono">30 Days</span></li>
              <li className="flex flex-col"><span className="text-slate-500">Graph Nodes</span><span className="text-white font-mono">1.2M (Terminals, Cards)</span></li>
              <li className="flex flex-col"><span className="text-slate-500">Graph Edges</span><span className="text-white font-mono">45.8M (Transactions)</span></li>
            </ul>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity size={18}/> Feature Importance</h2>
            <div className="space-y-3">
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Velocity Ratio (1h)</span><span className="text-cyan-400">88%</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '88%'}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Distance Anomaly</span><span className="text-cyan-400">74%</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '74%'}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Card BIN Risk</span><span className="text-cyan-400">65%</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '65%'}}></div></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
