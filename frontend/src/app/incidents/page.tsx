'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, Filter, Search, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function Incidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/incidents')
      .then(res => res.json())
      .then(data => {
        setIncidents(data);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-cyan-400" size={28} />
          <h1 className="text-2xl font-bold text-white tracking-wide">Incident Intelligence</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-900/50 border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
              <th className="p-4 font-medium">Incident ID</th>
              <th className="p-4 font-medium">Time (IST)</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Severity</th>
              <th className="p-4 font-medium">Exposure</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center p-8 text-slate-500">Loading intelligence feeds...</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-slate-500">No incidents found in current window.</td></tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition group">
                  <td className="p-4">
                    <Link href={`/incidents/${inc.id}`} className="font-mono text-cyan-400 hover:underline">{inc.id}</Link>
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-300">{new Date(inc.creation_time).toLocaleString()}</td>
                  <td className="p-4 text-sm text-slate-200">{inc.incident_type ? inc.incident_type.replace('_', ' ') : ''}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide ${
                      inc.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      inc.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>{inc.risk_level}</span>
                  </td>
                  <td className="p-4 font-mono text-white">{formatCurrency(inc.amount_at_risk)}</td>
                  <td className="p-4">
                    <span className={`text-xs ${
                      inc.status === 'NEW' ? 'text-amber-400' :
                      inc.status === 'RESOLVED' ? 'text-emerald-400' : 'text-cyan-400'
                    }`}>{inc.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
