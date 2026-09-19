'use client';
import { useState, useEffect, useMemo } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Clock, ShieldAlert, CheckCircle, Activity, Map as MapIcon, User, Terminal, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false });

export default function IncidentWorkspace() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [incident, setIncident] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{nodes: any[], edges: any[]}>({nodes: [], edges: []});
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, predRes, graphRes, timelineRes] = await Promise.all([
          fetch(`http://localhost:8000/api/incidents`),
          fetch(`http://localhost:8000/api/predictions/${id}`),
          fetch(`http://localhost:8000/api/incidents/${id}/graph`),
          fetch(`http://localhost:8000/api/incidents/${id}/timeline`)
        ]);
        
        const allIncidents = await incRes.json();
        const currentInc = allIncidents.find((i: any) => i.id === id);
        setIncident(currentInc);
        
        const preds = await predRes.json();
        setPredictions(preds);
        
        const graph = await graphRes.json();
        setGraphData(graph);
        
        const timeData = await timelineRes.json();
        setTimeline(timeData);
      } catch (err) {
        console.error("Failed to load workspace data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const int = setInterval(fetchData, 5000);
    return () => clearInterval(int);
  }, [id]);

  const handleAction = async (action: string) => {
    await fetch(`http://localhost:8000/api/incidents/${id}/${action}`, { method: 'POST' });
    const incRes = await fetch('http://localhost:8000/api/incidents');
    const allIncidents = await incRes.json();
    const currentInc = allIncidents.find((i: any) => i.id === id);
    setIncident(currentInc);
  };

  const chartData = predictions.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    prob: p.cashout_probability * 100
  }));

  const flowNodes: Node[] = graphData.nodes.map((n, i) => ({
    id: n.id,
    position: { x: (i % 3) * 200 + 100, y: Math.floor(i / 3) * 150 + 50 },
    data: { label: `${n.type.toUpperCase()}: ${n.id.substring(0,8)}` },
    style: { 
      background: n.type === 'terminal' ? '#0f172a' : '#1e293b', 
      color: n.risk === 'HIGH' || n.risk === 'TARGET' ? '#f43f5e' : '#38bdf8',
      border: `1px solid ${n.risk === 'HIGH' || n.risk === 'TARGET' ? '#be123c' : '#0369a1'}`,
      borderRadius: '8px',
      padding: '10px'
    }
  }));

  const flowEdges: Edge[] = graphData.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    label: e.label,
    style: { stroke: '#ec4899' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ec4899' }
  }));

  if (loading || !incident) return <div className="p-6 text-white">Loading Workspace...</div>;

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500" />
            Incident Workspace: {id}
          </h1>
          <p className="text-slate-400 mt-1">
            Status: <span className="text-cyan-400 font-bold">{incident.status}</span> | 
            Risk: <span className="text-rose-400 font-bold ml-1">{incident.risk_level}</span> | 
            Type: <span className="text-white ml-1">{incident.incident_type}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {incident.status === 'NEW' && (
            <button onClick={() => handleAction('acknowledge')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors">
              Acknowledge
            </button>
          )}
          {incident.status !== 'RESOLVED' && (
            <button onClick={() => handleAction('escalate')} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-sm transition-colors">
              Escalate to LEA
            </button>
          )}
          <button onClick={() => handleAction('resolve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors">
            Resolve Incident
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 mb-2 shrink-0">
        {['overview', 'network', 'predictions', 'timeline'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium uppercase tracking-wider ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-[500px] relative">
        {activeTab === 'overview' && (
          <div className="flex gap-4 h-full">
            <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
               <div className="p-3 bg-slate-900 border-b border-slate-700 font-semibold text-white">Threat Map</div>
               <div className="flex-1">
                  <MapComponent incidents={[incident]} predictions={predictions} />
               </div>
            </div>
            <div className="w-80 flex flex-col gap-4">
               <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">Incident Facts</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Amount at Risk</span><span className="text-white font-mono">₹{incident.amount_at_risk.toLocaleString()}</span></li>
                    <li className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Target Nodes</span><span className="text-white font-mono">{graphData.nodes.length}</span></li>
                    <li className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Cashout Prob</span><span className="text-rose-400 font-mono font-bold">{predictions.length > 0 ? (predictions[predictions.length-1].cashout_probability * 100).toFixed(1) + '%' : 'N/A'}</span></li>
                  </ul>
               </div>
            </div>
          </div>
        )}
        
        {activeTab === 'network' && (
          <div className="w-full h-full bg-slate-900 rounded-xl border border-slate-700">
            <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
              <Background color="#334155" />
              <Controls className="bg-slate-800 fill-white" />
            </ReactFlow>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="w-full h-full bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Cashout Probability Trajectory</h3>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Line type="monotone" dataKey="prob" stroke="#06b6d4" strokeWidth={3} dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="w-full h-full bg-slate-800/50 rounded-xl border border-slate-700 p-4 overflow-y-auto">
             <div className="space-y-4">
               {timeline.map((item, idx) => (
                 <div key={idx} className="flex gap-4 items-start">
                   <div className="w-24 shrink-0 text-xs text-slate-400 font-mono pt-1">
                     {new Date(item.timestamp).toLocaleTimeString()}
                   </div>
                   <div className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-lg">
                     <div className="font-bold text-cyan-400 mb-1">{item.type}</div>
                     <div className="text-sm text-slate-300">
                        {item.type === 'TRANSACTION' ? (
                           <span>Transfer of <strong className="text-rose-400">?{item.data.amount}</strong> from <span className="font-mono">{item.data.source}</span> to <span className="font-mono">{item.data.destination}</span></span>
                        ) : item.type === 'PREDICTION' ? (
                           <span>Risk Probability: <strong className="text-rose-400">{(item.data.cashout_probability * 100).toFixed(1)}%</strong> | Region: {item.data.predicted_region_h3}</span>
                        ) : item.type === 'NOTIFICATION' ? (
                           <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                              <div className="text-cyan-400 font-bold mb-1">[{item.data.channel}] ? {item.data.recipient}</div>
                              <div className="text-xs">{item.data.message}</div>
                              <div className="text-[10px] text-emerald-500 mt-1 uppercase tracking-wider">{item.data.status}</div>
                           </div>
                        ) : item.type === 'AUDIT' ? (
                           <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                              <div className="text-amber-400 font-bold mb-1">{item.data.action} by {item.data.user || 'SYSTEM'}</div>
                              <div className="text-xs mb-2">{item.data.details}</div>
                              {item.data.hash_chain && <div className="text-[10px] text-slate-500 font-mono break-all bg-black p-1 rounded">?? Blockchain Hash: {item.data.hash_chain}</div>}
                           </div>
                        ) : (
                           <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{JSON.stringify(item.data, null, 2)}</pre>
                        )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
