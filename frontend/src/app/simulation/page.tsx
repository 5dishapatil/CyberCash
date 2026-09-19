'use client';
import { useState, useEffect } from 'react';
import { FlaskConical, Play, RefreshCw, AlertCircle, Zap, Terminal, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '../store/notifications';

export default function SimulationLab() {
  const [activeTab, setActiveTab] = useState('guide');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const addToast = useNotificationStore(state => state.addToast);
  const [demoScript, setDemoScript] = useState<any[]>([]);
  const [demoStep, setDemoStep] = useState<number>(-1);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoTime, setDemoTime] = useState(0);

  useEffect(() => {
    // FIX: The correct endpoint is /api/scenarios
    fetch('http://localhost:8000/api/scenarios')
      .then(r => r.json())
      .then(d => {
        // Handle array directly if that's what the API returns, or wrap in safety checks
        setScenarios(Array.isArray(d) ? d : d.scenarios || []);
      })
      .catch(e => console.error(e));
      
    fetch('http://localhost:8000/api/simulation/demo/script')
      .then(r => r.json())
      .then(d => setDemoScript(d.script || []))
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
      setDemoTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [demoRunning]);

  useEffect(() => {
    if (!demoRunning) return;
    const matchingStep = (demoScript || []).findIndex(s => s.time_offset === demoTime);
    if (matchingStep !== -1 && matchingStep !== demoStep) {
      setDemoStep(matchingStep);
      const step = demoScript[matchingStep];
      addToast(step.description, 'info');
      if (step.event === 'trigger_scenario_3') {
        // We do not call triggerScenario directly here to avoid opening the modal during automated demo
        // Just simulate the event in the background for the demo
        fetch(`http://localhost:8000/api/simulation/scenario/3`, { method: 'POST' }).catch(console.error);
      } else if (step.event === 'attack_switch_atm') {
        triggerAttack('switch_atm');
      }
    }
    if (demoTime > (demoScript[demoScript.length-1]?.time_offset || 60) + 5) {
      setDemoRunning(false);
    }
  }, [demoTime, demoRunning, demoScript, demoStep, addToast]);

  const startDemo = () => {
    setDemoTime(0);
    setDemoStep(-1);
    setDemoRunning(true);
    addToast('The deterministic simulation has begun.', 'success');
  };

  // Group scenarios into logic categories for the UI
  const legitScenarios = (scenarios || []).filter(s => s.id === 1 || s.id === 2 || s.id === 10);
  const fraudScenarios = (scenarios || []).filter(s => s.id >= 3 && s.id <= 9 && s.id !== 10);

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative animate-in fade-in duration-500">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-cyan-400" />
            Simulation & Testing Lab
          </h1>
          <p className="text-slate-400 mt-1">Control synthetic environments, run walkthroughs, and test model resilience.</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          {['guide', 'judge', 'attack', 'executive'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'guide' ? 'Project Guide' :
               tab === 'judge' ? 'Interactive Scenarios' : 
               tab === 'attack' ? 'Adversarial Shifts' : 'Automated Replay'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* TAB: PROJECT GUIDE */}
        {activeTab === 'guide' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><BookOpen size={120} /></div>
               <h2 className="text-3xl font-bold text-white mb-4">Welcome to CyberCash Sentinel</h2>
               <p className="text-indigo-200 text-lg max-w-2xl mx-auto">This system provides an end-to-end predictive analytics framework for detecting and forecasting likely cash withdrawals resulting from cybercrime complaints (MHA/I4C SIH26184).</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">1</div> Dashboard & Command Center</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">Real-time monitoring of all synthetic transactions. View active incidents, system health, and overall monetary risk. The dashboard aggregates predictions dynamically.</p>
               </div>

               <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">2</div> GIS & Strategic Map</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">A geographic visualization engine (OpenStreetMap based) showing origin bank accounts, predicted terminal locations, and simulated travel radius boundaries for attackers.</p>
               </div>

               <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div> Incident Investigation</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">Deep dive into a specific incident. View transaction graphs, predictive features, and take action (hold funds, dispatch LEA) using Role-Based Access Control.</p>
               </div>

               <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><div className="w-8 h-8 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">4</div> Model Validation</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">View independent, rigorous evaluation metrics of our predictive heuristic. Contains confusion matrices, precision/recall stats, and baseline comparisons.</p>
               </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-lg font-semibold text-white mb-4">How to Evaluate the Prototype</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-slate-200">Trigger Scenarios:</strong> Head to the <em>Interactive Scenarios</em> tab and click a scenario. It injects transactions into the engine.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-slate-200">Role Play:</strong> Use the login page to switch between Bank Officer, LEA Officer, and I4C Analyst to see filtered incident views.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-slate-200">Track Notifications:</strong> Notice the toast alerts simulating Webhooks, SMS, and Email dispatches across different organizations.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB: JUDGE (INTERACTIVE SCENARIOS) */}
        {activeTab === 'judge' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-300">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Interactive Scenarios</h2>
              <p className="text-slate-400 max-w-3xl">Inject specific behavioral patterns into the simulation engine. The predictive model will automatically capture these transactions, build a graph, and generate incident reports.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Legitimate Behavior & False Positives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(legitScenarios || []).map(s => (
                    <div key={s.id} className="bg-slate-800/80 border border-emerald-500/20 p-5 rounded-xl flex justify-between items-center group hover:border-emerald-500/60 hover:bg-slate-800 transition-all duration-300">
                      <div>
                        <h4 className="text-white font-medium text-lg">Scenario {s.id}: {s.name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{s.description}</p>
                      </div>
                      <button onClick={() => triggerScenario(s.id)} className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-full transition-all duration-300 transform group-hover:scale-110 shadow-lg"><Play size={20} fill="currentColor" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-rose-400 mb-4 flex items-center gap-2 mt-8"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Fraudulent & Adversarial Behavior</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(fraudScenarios || []).map(s => (
                    <div key={s.id} className="bg-slate-800/80 border border-rose-500/20 p-5 rounded-xl flex justify-between items-start flex-col group hover:border-rose-500/60 hover:bg-slate-800 transition-all duration-300 min-h-[160px]">
                      <div>
                        <h4 className="text-white font-medium text-lg mb-2">{s.name}</h4>
                        <p className="text-sm text-slate-400">{s.description}</p>
                      </div>
                      <div className="mt-4 w-full flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">ID: {s.id}</span>
                        <button onClick={() => triggerScenario(s.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-full transition-all duration-300 transform group-hover:-translate-y-1 shadow-lg"><Play size={18} fill="currentColor" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ATTACK (ADVERSARIAL LAB) */}
        {activeTab === 'attack' && (
          <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 duration-300 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-4">Adversarial Adaptation Lab</h2>
              <p className="text-slate-400 text-lg">Deploy evolving malware strains to test system recalibration dynamically while a scenario is running.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
               <div onClick={() => triggerAttack('switch_atm')} className="p-8 border border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-transparent hover:border-rose-500/60 hover:from-rose-500/20 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-xl group">
                  <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <AlertCircle size={40} className="text-rose-500" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">Switch Target Terminal</h3>
                  <p className="text-sm text-slate-300">Attacker realizes LEA surveillance and shifts location dynamically. Forces the geographic engine to expand radius.</p>
               </div>
               
               <div onClick={() => triggerAttack('accelerate_cashout')} className="p-8 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-500/60 hover:from-amber-500/20 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-xl group">
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap size={40} className="text-amber-500" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">Accelerate Cashout</h3>
                  <p className="text-sm text-slate-300">Attacker speeds up the withdrawal by bypassing intermediate mules. Forces the temporal model to flag burst velocity.</p>
               </div>
            </div>
          </div>
        )}

        {/* TAB: EXECUTIVE DEMO */}
        {activeTab === 'executive' && (
          <div className="flex flex-col lg:flex-row gap-8 h-full animate-in slide-in-from-right-8 duration-300">
             <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900/50 rounded-2xl border border-slate-700/50 p-8">
                 <button onClick={startDemo} disabled={demoRunning} className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.2)] transition-all duration-500 ${demoRunning ? 'bg-indigo-900 text-indigo-400 scale-95 shadow-indigo-500/50' : 'bg-indigo-500 text-white hover:bg-indigo-400 hover:scale-105'}`}>
                   {demoRunning ? <RefreshCw size={50} className="animate-spin" /> : <Play size={50} fill="currentColor" className="ml-3" />}
                 </button>
                 <h2 className="text-3xl font-bold text-white mb-4">Automated Executive Replay</h2>
                 <p className="text-slate-300 text-lg max-w-lg mb-8">A fully automated, deterministic replay synced with narrative cards explaining system actions in real-time to stakeholders.</p>
                 
                 <div className="flex flex-col items-center gap-4">
                   <div className="font-mono text-cyan-400 text-3xl border-2 border-cyan-500/30 bg-cyan-900/30 px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                     T + {String(demoTime).padStart(3, '0')}s
                   </div>
                   {demoRunning && <div className="text-sm text-cyan-500 animate-pulse mt-2">Simulation Engine Active...</div>}
                 </div>
             </div>
             
             <div className="w-full lg:w-[450px] bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2 text-lg"><Terminal size={20} className="text-slate-400"/> Replay Sequence</h3>
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 relative">
                  {(demoScript || []).map((step, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all duration-500 flex gap-4 ${idx === demoStep ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' : idx < demoStep ? 'bg-slate-900/80 border-slate-700 opacity-60' : 'bg-slate-800/80 border-slate-700/50'}`}>
                       <div className="flex flex-col items-center pt-1">
                         <div className={`w-2 h-2 rounded-full ${idx === demoStep ? 'bg-indigo-400 animate-ping' : idx < demoStep ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                         {idx < (demoScript?.length || 0) - 1 && <div className="w-0.5 h-full bg-slate-700 mt-2"></div>}
                       </div>
                       <div className="flex-1 pb-2">
                         <div className="text-xs text-indigo-300 font-mono mb-1 font-semibold">T + {step.time_offset}s</div>
                         <div className={`text-sm ${idx === demoStep ? 'text-white font-medium' : 'text-slate-400'}`}>{step.description}</div>
                       </div>
                    </div>
                  ))}
                  {(!demoScript || demoScript.length === 0) && (
                    <div className="text-slate-500 text-center py-10">Replay script unavailable.</div>
                  )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
