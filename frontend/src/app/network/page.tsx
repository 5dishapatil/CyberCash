'use client';
import { GitBranch } from 'lucide-react';

export default function NetworkAnalysis() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <GitBranch className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold text-white">Network Analysis</h1>
      </div>
      <p className="text-slate-400">This module is being deployed.</p>
    </div>
  );
}
