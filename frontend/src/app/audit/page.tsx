'use client';
import { Shield } from 'lucide-react';

export default function AuditSecurity() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold text-white">Audit & Security</h1>
      </div>
      <p className="text-slate-400">This module is being deployed.</p>
    </div>
  );
}
