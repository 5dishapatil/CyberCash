'use client';
import { FileText, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="flex h-full flex-col p-4 gap-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-cyan-400" />
          Intelligence Reports
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-sm transition-colors">
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-4">Summary Statistics</h3>
           {stats ? (
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div className="bg-slate-900 p-4 rounded-lg">
                 <div className="text-slate-400">Total Events Processed</div>
                 <div className="text-2xl text-white font-mono">{stats.events_processed?.toLocaleString() || 'N/A'}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-lg">
                 <div className="text-slate-400">Avg Lead Time</div>
                 <div className="text-2xl text-white font-mono">{stats.avg_lead_time_minutes || 'N/A'} min</div>
               </div>
             </div>
           ) : (
             <div className="text-slate-500">Loading stats...</div>
           )}
        </div>
        
        <div className="col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-4">Generated Reports</h3>
           <ul className="space-y-3">
             <li className="flex justify-between items-center p-3 bg-slate-900 rounded-lg hover:border-cyan-500 border border-transparent transition-colors cursor-pointer">
               <span className="text-sm text-slate-300">Daily Threat Briefing</span>
               <span className="text-xs text-slate-500">Today</span>
             </li>
             <li className="flex justify-between items-center p-3 bg-slate-900 rounded-lg hover:border-cyan-500 border border-transparent transition-colors cursor-pointer">
               <span className="text-sm text-slate-300">Weekly Ops Summary</span>
               <span className="text-xs text-slate-500">Yesterday</span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
