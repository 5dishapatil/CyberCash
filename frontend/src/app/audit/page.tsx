'use client';
import { useState, useEffect } from 'react';
import { Shield, Search, FileText, CheckCircle, X, ExternalLink, Network, FileCode, Clock, Server, User, ArrowRight, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [logContext, setLogContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/audit')
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(console.error);
  }, []);

  const handleLogClick = async (log: any) => {
    setSelectedLog(log);
    setLogContext(null);
    setLoadingContext(true);

    // Try to extract an incident ID (e.g. INC_1234abcd)
    const match = log.details?.match(/INC_[a-f0-9]+/i);
    const incidentId = match ? match[0] : null;

    if (incidentId) {
      try {
        const [incRes, timelineRes, graphRes] = await Promise.all([
          fetch(`http://localhost:8000/api/incidents`),
          fetch(`http://localhost:8000/api/incidents/${incidentId}/timeline`),
          fetch(`http://localhost:8000/api/incidents/${incidentId}/graph`)
        ]);
        
        const incData = await incRes.json();
        const incident = incData.find((i:any) => i.id === incidentId);
        const timeline = timelineRes.ok ? await timelineRes.json() : [];
        const graph = graphRes.ok ? await graphRes.json() : { nodes: [], edges: [] };
        
        // Extract transactions
        const txs = timeline.filter((t:any) => t.type === 'TRANSACTION');
        // Extract target terminals
        const terminals = graph.nodes.filter((n:any) => n.type === 'terminal');
        
        setLogContext({
          incident,
          txs,
          terminals,
          incidentId
        });
      } catch (err) {
        console.error("Failed to fetch context", err);
      }
    }
    setLoadingContext(false);
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col p-4 gap-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-cyan-400" />
          Audit & Security Logs
        </h1>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 w-64" 
            />
          </div>
          <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Export CSV</button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700 sticky top-0">
              <tr>
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">User / Actor</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map(log => (
                <tr 
                  key={log.id} 
                  onClick={() => handleLogClick(log)}
                  className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 flex items-center gap-2">
                     <User size={14} className={log.user_id === 'SYSTEM' ? 'text-slate-500' : 'text-emerald-400'} />
                     {log.user_id}
                  </td>
                  <td className="p-3 font-mono text-cyan-400 text-xs">{log.action}</td>
                  <td className="p-3">{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No logs match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT MODAL */}
      {selectedLog && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-8 z-50 animate-in fade-in">
          <div className="bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-cyan-400" />
                Audit Record Dossier — {String(selectedLog.id).substring(0,8)}
              </h2>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              
              {/* Primary Action Panel */}
              <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg">
                <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4 font-semibold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" /> Executive Action Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Timestamp:</span> <span className="text-white font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</span></div>
                  <div><span className="text-slate-500">Initiator (User):</span> <span className="text-white font-bold">{selectedLog.user_id}</span></div>
                  <div><span className="text-slate-500">Action Code:</span> <span className="text-cyan-400 font-mono font-bold">{selectedLog.action}</span></div>
                  <div><span className="text-slate-500">System Trace ID:</span> <span className="text-slate-300 font-mono text-xs">{selectedLog.id}</span></div>
                  <div className="col-span-2 mt-2">
                    <span className="text-slate-500">Operation Details:</span>
                    <div className="mt-1 p-3 bg-black/40 border border-slate-700 rounded text-amber-300 font-mono">
                      {selectedLog.details}
                    </div>
                  </div>
                </div>
              </div>

              {loadingContext ? (
                <div className="flex items-center gap-2 text-cyan-400 p-4 justify-center">
                  <Server className="animate-pulse" /> Retrieving deeply correlated telemetry...
                </div>
              ) : logContext ? (
                <>
                  {/* Correlated Incident Data */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Transactions Panel */}
                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg flex flex-col">
                       <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4 font-semibold flex items-center gap-2">
                         <Network size={16} className="text-blue-400" /> Transaction Trace
                       </h3>
                       <div className="flex-1 overflow-y-auto max-h-60 space-y-3">
                         {logContext.txs && logContext.txs.length > 0 ? logContext.txs.map((tx:any, i:number) => (
                           <div key={i} className="text-xs bg-slate-800 p-2 rounded border border-slate-700">
                             <div className="flex justify-between mb-1">
                               <span className="text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                               <span className="text-emerald-400 font-bold">₹{tx.data?.amount?.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center gap-2 text-slate-300 font-mono text-[10px]">
                               <span>{tx.data?.source}</span>
                               <ArrowRight size={12} className="text-slate-500" />
                               <span>{tx.data?.destination}</span>
                             </div>
                           </div>
                         )) : <div className="text-slate-500 text-sm">No localized transactions captured.</div>}
                       </div>
                    </div>

                    {/* Terminals Panel */}
                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg flex flex-col">
                       <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4 font-semibold flex items-center gap-2">
                         <MapIcon size={16} className="text-rose-400" /> Target Terminal Nodes
                       </h3>
                       <div className="flex-1 overflow-y-auto max-h-60 space-y-3">
                         {logContext.terminals && logContext.terminals.length > 0 ? logContext.terminals.map((t:any, i:number) => (
                           <div key={i} className="text-xs bg-slate-800 p-2 rounded border border-slate-700">
                             <div className="flex justify-between mb-1">
                               <span className="text-white font-mono font-bold">ID: {t.id}</span>
                               <span className="text-rose-400 font-bold">{t.risk}</span>
                             </div>
                             <div className="text-slate-400">Marked as potential cash-out exit point in incident graph.</div>
                           </div>
                         )) : <div className="text-slate-500 text-sm">No high-risk terminals identified in scope.</div>}
                       </div>
                    </div>
                  </div>
                  
                  {/* Footer Context Info */}
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center text-sm">
                    <span className="text-slate-400">Context: <strong className="text-white">Incident {logContext.incidentId}</strong></span>
                    <Link href={`/incidents/${logContext.incidentId}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-950/50 px-3 py-1.5 rounded">
                      Open Incident Workspace <ExternalLink size={14} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-lg text-center flex flex-col items-center justify-center">
                   <FileCode size={32} className="text-slate-600 mb-2" />
                   <div className="text-slate-400">System event without deeply linked contextual graph telemetry.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
