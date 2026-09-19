'use client';
import { Shield, Search } from 'lucide-react';

const mockLogs = [
  { id: 'A-101', time: '14:23:10', user: 'SYSTEM', action: 'INCIDENT_CREATED', details: 'Automated correlation matched rule R-99', ip: '10.0.1.44' },
  { id: 'A-102', time: '14:25:01', user: 'OP-04 (John)', action: 'STATUS_CHANGE', details: 'Updated INC-588 to IN_PROGRESS', ip: '192.168.1.102' },
  { id: 'A-103', time: '14:26:45', user: 'OP-04 (John)', action: 'DISPATCH', details: 'Dispatched response unit to Pune Zone 4', ip: '192.168.1.102' },
];

export default function AuditLogs() {
  return (
    <div className="flex h-full flex-col p-4 gap-4">
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
            <input type="text" placeholder="Search logs..." className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 w-64" />
          </div>
          <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Export CSV</button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">User / Actor</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Details</th>
                <th className="p-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {mockLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-xs">{log.time}</td>
                  <td className="p-3">{log.user}</td>
                  <td className="p-3 font-mono text-cyan-400 text-xs">{log.action}</td>
                  <td className="p-3">{log.details}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
