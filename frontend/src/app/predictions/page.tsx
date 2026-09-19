'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Target, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

export default function Predictions() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/predictions')
      .then(r => r.json())
      .then(d => {
         setPredictions(d.reverse());
         setLoading(false);
      });
  }, []);

  const timeSeriesData = predictions.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    prob: (p.prob * 100).toFixed(1)
  }));
  
  const scatterData = predictions.map((p, i) => ({
    x: i,
    y: (p.prob * 100).toFixed(1),
    z: 1
  }));

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-cyan-400" />
          Model Predictions & Confidence
        </h1>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-cyan-400 gap-2">
           <Loader className="animate-spin" /> Fetching predictive telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 flex-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Aggregate Cashout Probability</h3>
            <p className="text-sm text-slate-400 mb-6">Real-time predictive scoring across all monitored networks.</p>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Line type="monotone" dataKey="prob" stroke="#06b6d4" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Confidence Distribution</h3>
            <p className="text-sm text-slate-400 mb-6">Prediction confidence clusters (Anomaly Detection output).</p>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" dataKey="x" name="Instance" stroke="#94a3b8" tick={false} />
                  <YAxis type="number" dataKey="y" name="Probability %" domain={[0, 100]} stroke="#94a3b8" />
                  <ZAxis type="number" dataKey="z" range={[50, 50]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Scatter name="Predictions" data={scatterData} fill="#f43f5e" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
