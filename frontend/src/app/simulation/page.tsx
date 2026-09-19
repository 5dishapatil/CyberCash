'use client';
import { useState } from 'react';
import { FlaskConical, Play, Pause, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

export default function SimulationLab() {
  const [activeTab, setActiveTab] = useState('judge');

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-cyan-400" />
            Simulation & Testing Lab
          </h1>
          <p className="text-slate-400 mt-1">Control synthetic environments and test model resilience</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          {['judge', 'attack', 'replay', 'executive'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'judge' ? 'Judge Test Lab' : 
               tab === 'attack' ? 'Attack Lab' : 
               tab === 'replay' ? 'Historical Replay' : 'Executive Demo'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 overflow-y-auto">
        {activeTab === 'judge' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-white">Judge Evaluator Scenarios</h2>
            <p className="text-slate-400">Run the 10 core adversarial scenarios to test agent reasoning.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">Scenario {i}: Distraction Payload</h4>
                    <p className="text-xs text-slate-500 mt-1">Tests if model ignores noise and spots real threat.</p>
                  </div>
                  <button className="p-2 bg-slate-800 hover:bg-cyan-900 text-cyan-400 rounded-full"><Play size={16} fill="currentColor" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attack' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-white">Adversarial Adaptation Lab</h2>
            <p className="text-slate-400">Deploy evolving malware strains to test system recalibration.</p>
            <div className="p-8 border border-rose-500/20 bg-rose-500/5 rounded-lg flex flex-col items-center justify-center text-center mt-8">
              <AlertCircle size={48} className="text-rose-500 mb-4" />
              <h3 className="text-white font-medium mb-2">Initiate Coordinated Strike</h3>
              <button className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900">Launch Simulation</button>
            </div>
          </div>
        )}

        {activeTab === 'replay' && (
          <div className="flex flex-col gap-4 h-full">
            <h2 className="text-xl font-semibold text-white">Historical Replay</h2>
            <p className="text-slate-400">Review past incidents with full time-scrubbing capabilities.</p>
            
            <div className="mt-auto bg-slate-900 border border-slate-700 p-6 rounded-lg flex flex-col gap-6">
              <div className="flex justify-between text-sm text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={14}/> 2024-10-14 00:00</span>
                <span className="flex items-center gap-1"><Calendar size={14}/> 2024-10-15 00:00</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full relative cursor-pointer">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-cyan-500 rounded-full"></div>
                <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-white rounded-full shadow -translate-y-1/2 -translate-x-1/2 border-2 border-cyan-500"></div>
              </div>
              <div className="flex justify-center gap-4">
                <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white"><RefreshCw size={20} /></button>
                <button className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white"><Play size={20} fill="currentColor" /></button>
                <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white"><Pause size={20} /></button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'executive' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
             <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-2 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
               <Play size={40} fill="currentColor" className="ml-2" />
             </div>
             <h2 className="text-3xl font-bold text-white">Executive Demonstration</h2>
             <p className="text-slate-400 max-w-lg">A fully automated, deterministic replay synced with narrative cards explaining system actions in real-time to stakeholders.</p>
             <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-lg transition-colors mt-4">Start Guided Tour</button>
          </div>
        )}
      </div>
    </div>
  );
}
