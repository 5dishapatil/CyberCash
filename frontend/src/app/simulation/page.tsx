'use client';
import { FlaskConical } from 'lucide-react';

export default function SimulationLab() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <FlaskConical className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold text-white">Simulation Lab</h1>
      </div>
      <p className="text-slate-400">This module is being deployed.</p>
    </div>
  );
}
