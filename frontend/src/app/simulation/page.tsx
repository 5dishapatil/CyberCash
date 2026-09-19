'use client';
import { useState, useEffect } from 'react';
import { FlaskConical, Play, Pause, RefreshCw, AlertCircle, Calendar, Zap, Terminal } from 'lucide-react';
import { useNotificationStore } from '../store/notifications';

export default function SimulationLab() {
  const [activeTab, setActiveTab] = useState('judge');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const addToast = useNotificationStore(state => state.addToast);
  const [demoScript, setDemoScript] = useState<any[]>([]);
  const [demoStep, setDemoStep] = useState<number>(-1);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoTime, setDemoTime] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8000/api/simulation/scenarios')
      .then(r => r.json())
      .then(d => setScenarios(d.scenarios))
      .catch(e => console.error(e));
      
    fetch('http://localhost:8000/api/simulation/demo/script')
      .then(r => r.json())
      .then(d => setDemoScript(d.script))
      .catch(e => console.error(e));
  }, []);

  const triggerScenario = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/simulation/scenario/${id}`, { method: 'POST' });
      addToast(`Scenario ${id} has been injected into the engine.`, 'info');
    } catch (e) {
      addToast('Failed to trigger scenario.', 'error');
    }
  };

  const triggerAttack = async (action: string) => {
    try {
      // Find latest incident to attack
      const r = await fetch('http://localhost:8000/api/incidents');
      const incs = await r.json();
      if (incs.length === 0) {
        addToast('No active incident to attack. Run a scenario first.', 'warning');
        return;
      }
      const inc = incs[0];
      
      await fetch('http://localhost:8000/api/simulation/attack', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: inc.id, action: action, params: { minutes: 5 } })
      });
      addToast(`Attacker strategy shifted: ${action}`, 'error');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!demoRunning) return;
    const interval = setInterval(() => {
      setDemoTime(prev => {
        const nextTime = prev + 1;
        const matchingStep = demoScript.findIndex(s => s.time_offset === nextTime);
        if (matchingStep !== -1) {
          setDemoStep(matchingStep);
          const step = demoScript[matchingStep];
          addToast(step.description, 'info');
          if (step.event === 'trigger_scenario_3') {
            triggerScenario(3);
          } else if (step.event === 'attack_switch_atm') {
            triggerAttack('switch_atm');
          }
        }
        if (nextTime > (demoScript[demoScript.length-1]?.time_offset || 60) + 5) {
          setDemoRunning(false);
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [demoRunning, demoScript]);

  const startDemo = () => {
    setDemoTime(0);
    setDemoStep(-1);
    setDemoRunning(true);
    addToast('The deterministic simulation has begun.', 'success');
  };

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-cyan-400" />
            Simulation & Testing Lab
          </h1>
          <p className="text-slate-400 mt-1">Control synthetic environments and test model resilience</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          {['judge', 'attack', 'executive'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'judge' ? 'Judge Test Lab' : 
               tab === 'attack' ? 'Attack Lab' : 'Executive Demo'}
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
              {scenarios.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center group hover:border-cyan-500/50 transition">
                  <div>
                    <h4 className="text-white font-medium">Scenario {s.id}: {s.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                  </div>
                  <button onClick={() => triggerScenario(s.id)} className="p-2 bg-slate-800 hover:bg-cyan-900 text-cyan-400 rounded-full transition-transform group-hover:scale-110"><Play size={16} fill="currentColor" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attack' && (
          <div className="flex flex-col gap-4 h-full">
            <h2 className="text-xl font-semibold text-white">Adversarial Adaptation Lab</h2>
            <p className="text-slate-400">Deploy evolving malware strains to test system recalibration dynamically.</p>
            <div className="grid grid-cols-2 gap-6 mt-4">
               <div onClick={() => triggerAttack('switch_atm')} className="p-6 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition">
                  <AlertCircle size={32} className="text-rose-500 mb-2" />
                  <h3 className="text-white font-medium">Switch Target ATM</h3>
                  <p className="text-xs text-slate-400 mt-2">Attacker realizes surveillance and shifts location.</p>
               </div>
               <div onClick={() => triggerAttack('accelerate_cashout')} className="p-6 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition">
                  <Zap size={32} className="text-amber-500 mb-2" />
                  <h3 className="text-white font-medium">Accelerate Cashout</h3>
                  <p className="text-xs text-slate-400 mt-2">Attacker speeds up the withdrawal by 5 minutes.</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'executive' && (
          <div className="flex gap-8 h-full">
             <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <button onClick={startDemo} disabled={demoRunning} className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(99,102,241,0.2)] transition-all ${demoRunning ? 'bg-slate-800 text-slate-500' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}>
                   {demoRunning ? <RefreshCw size={40} className="animate-spin" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                 </button>
                 <h2 className="text-3xl font-bold text-white mb-2">Executive Demonstration</h2>
                 <p className="text-slate-400 max-w-md">A fully automated, deterministic replay synced with narrative cards explaining system actions in real-time to stakeholders.</p>
                 <div className="mt-8 font-mono text-cyan-400 text-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 rounded-lg">T + {demoTime}s</div>
             </div>
             <div className="w-96 bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-y-auto">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Terminal size={18}/> Demo Script Log</h3>
                <div className="space-y-4">
                  {demoScript.map((step, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border transition-all ${idx === demoStep ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : idx < demoStep ? 'bg-slate-800 border-slate-700 opacity-50' : 'bg-slate-800/50 border-slate-800'}`}>
                       <div className="text-xs text-slate-400 font-mono mb-1">T + {step.time_offset}s</div>
                       <div className={`font-medium ${idx === demoStep ? 'text-white' : 'text-slate-300'}`}>{step.description}</div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
