'use client';
import { Map } from 'lucide-react';

export default function GISIntelligence() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <Map className="text-cyan-400" size={28} />
        <h1 className="text-2xl font-bold text-white">GIS Intelligence</h1>
      </div>
      <p className="text-slate-400">This module is being deployed.</p>
    </div>
  );
}
