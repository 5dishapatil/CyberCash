'use client';
import { Brain, Activity, Database, Zap, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

export default function ModelOps() {
  const [metrics, setMetrics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/ml/independent-evaluation')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setMetrics(data);
      })
      .catch(console.error);
      
    fetch('http://localhost:8000/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative overflow-y-auto">
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Prototype validated on synthetic unseen scenarios.</h3>
          <p className="text-xs opacity-80 mt-1">
            Metrics shown reflect prototype validation only. Not indicative of production accuracy, national-scale validation, or real-world law-enforcement effectiveness.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-cyan-400" />
            Model Operations & Validation
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> MODEL ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Model Card: Hand-Calibrated Logistic Sigmoid</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><span className="text-slate-500 block mb-1">Architecture</span><span className="text-white">Heuristic / Logistic Sigmoid</span></div>
              <div><span className="text-slate-500 block mb-1">Target</span><span className="text-white">ATM Cashout Prediction</span></div>
              <div><span className="text-slate-500 block mb-1">Training Paradigm</span><span className="text-white">Hand-Calibrated (Not Learned)</span></div>
              <div><span className="text-slate-500 block mb-1">Version</span><span className="text-white font-mono">v1.0-prototype</span></div>
            </div>
            
            <div className="mt-6 border-t border-slate-700 pt-4">
               <h3 className="text-sm font-semibold text-slate-300 mb-2">Features Used</h3>
               <div className="flex flex-wrap gap-2 text-xs">
                 <span className="px-2 py-1 bg-slate-700 rounded">amount_5m</span>
                 <span className="px-2 py-1 bg-slate-700 rounded">amount_24h</span>
                 <span className="px-2 py-1 bg-slate-700 rounded">velocity_5m</span>
                 <span className="px-2 py-1 bg-slate-700 rounded">fan_in</span>
                 <span className="px-2 py-1 bg-slate-700 rounded">fan_out</span>
                 <span className="px-2 py-1 bg-slate-700 rounded">acc_age</span>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-md font-semibold text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-pink-400"/> Demo Scenario Result</h2>
                <p className="text-xs text-slate-400 mb-4">Results from a single deterministic demo replay. Not representative of aggregate performance.</p>
                {stats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision@5</span><span className="text-emerald-400 font-mono">{(stats.precision_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Recall@5</span><span className="text-emerald-400 font-mono">{(stats.recall_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">NDCG@5</span><span className="text-emerald-400 font-mono">{(stats.ndcg_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Lead Time</span><span className="text-cyan-400 font-mono">{stats.avg_lead_time} min</span></div>
                  </div>
                ) : <div className="animate-pulse h-24 bg-slate-700/50 rounded"></div>}
             </div>
             
             <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
                <h2 className="text-md font-semibold text-indigo-300 mb-4 flex items-center gap-2"><ShieldCheck size={16}/> Independent Test Performance</h2>
                <p className="text-xs text-indigo-200/60 mb-4">Evaluated on unseen synthetic test set.</p>
                {metrics ? (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision@1</span><span className="text-white font-mono">{(metrics.evaluation.precision_at_1 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision@5</span><span className="text-white font-mono">{(metrics.evaluation.precision_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Recall@5</span><span className="text-white font-mono">{(metrics.evaluation.recall_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">NDCG@5</span><span className="text-white font-mono">{(metrics.evaluation.ndcg_at_5 * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">False Positive Rate</span><span className="text-rose-400 font-mono">{(metrics.evaluation.false_positive_rate * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Brier Score</span><span className="text-white font-mono">{metrics.evaluation.avg_calibration_error}</span></div>
                    <div className="flex justify-between"><span className="text-slate-300 text-sm">Avg Lead Time</span><span className="text-white font-mono">{metrics.evaluation.avg_lead_time} min</span></div>
                  </div>
                ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded"></div>}
             </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Database size={18}/> Independent Test Set</h2>
            {metrics ? (
              <ul className="space-y-4 text-sm">
                <li className="flex flex-col"><span className="text-slate-500">Total Scenarios</span><span className="text-white font-mono">{metrics.dataset_size.total}</span></li>
                <li className="flex justify-between items-center"><span className="text-emerald-400">Legit</span><span className="text-white font-mono">{metrics.dataset_size.legit_tested}</span></li>
                <li className="flex justify-between items-center"><span className="text-rose-400">Classic Fraud</span><span className="text-white font-mono">{metrics.dataset_size.fraud_tested}</span></li>
                <li className="flex justify-between items-center"><span className="text-orange-400">Adversarial</span><span className="text-white font-mono">{metrics.dataset_size.adversarial_tested}</span></li>
                <li className="flex justify-between items-center"><span className="text-slate-400">Hard Negative</span><span className="text-white font-mono">{metrics.dataset_size.hard_negative_tested}</span></li>
              </ul>
            ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded"></div>}
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity size={18}/> Feature Coefficients</h2>
            <div className="space-y-3">
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Velocity Ratio (f1)</span><span className="text-cyan-400">w=3.5</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '100%'}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Amount Risk (f2)</span><span className="text-cyan-400">w=2.0</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '60%'}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">Fan Out (f3)</span><span className="text-cyan-400">w=2.5</span></div>
                 <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full" style={{width: '75%'}}></div></div>
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Weights applied linearly before sigmoid activation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
