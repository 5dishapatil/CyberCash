'use client';
import { FileText, Download, Activity, Target, Clock, ShieldAlert, Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(e => console.error(e));
  }, []);

  const statCards = [
    { label: 'Active Incidents', value: stats?.active_incidents || 0, icon: Activity, color: 'text-rose-400' },
    { label: 'Total Incidents Evaluated', value: stats?.total_evaluated || 0, icon: ShieldAlert, color: 'text-amber-400' },
    { label: 'Top-5 Precision', value: `${((stats?.precision_at_5 || 0) * 100).toFixed(1)}%`, icon: Target, color: 'text-cyan-400' },
    { label: 'Avg Advance Warning', value: `${stats?.avg_lead_time || 0} min`, icon: Clock, color: 'text-emerald-400' },
    { label: 'Avg Geo Error', value: `${stats?.avg_geo_error || 0} km`, icon: Crosshair, color: 'text-indigo-400' },
  ];

  return (
    <div className="flex h-full flex-col p-6 gap-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-cyan-400" />
          Intelligence Reports
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-cyan-900/20">
          <Download size={16} /> Export Intelligence PDF
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-y-auto">
           <h3 className="text-lg font-semibold text-white mb-6">Live Evaluation Metrics</h3>
           {stats ? (
             <div className="grid grid-cols-3 gap-6 text-sm">
               {statCards.map((c, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4">
                     <div className="text-slate-400 font-medium uppercase tracking-wider text-xs">{c.label}</div>
                     <c.icon size={18} className={c.color} />
                   </div>
                   <div className="text-3xl text-white font-mono font-bold">{c.value}</div>
                 </div>
               ))}
               <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4">
                     <div className="text-slate-400 font-medium uppercase tracking-wider text-xs">Total At Risk</div>
                   </div>
                   <div className="text-2xl text-amber-400 font-mono font-bold">
                     ₹{(stats?.amount_at_risk || 0).toLocaleString()}
                   </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center justify-center p-12 text-slate-500">Loading intelligence metrics...</div>
           )}
        </div>
        
        <div className="col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-6">Generated Reports</h3>
           <ul className="space-y-4">
             {['Daily Threat Briefing', 'Weekly Ops Summary', 'Mule Network Analysis', 'ATM Hotspot Report'].map((title, i) => (
               <li key={i} className="group p-4 bg-slate-900 rounded-xl hover:border-cyan-500/50 border border-slate-700 transition-colors cursor-pointer">
                 <div className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition">{title}</div>
                 <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                   <span>PDF Document</span>
                   <span>{(i*2 + 1)}h ago</span>
                 </div>
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
}
