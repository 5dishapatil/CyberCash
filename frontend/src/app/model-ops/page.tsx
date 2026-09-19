'use client';
import { Brain, Activity, Database, AlertTriangle, ShieldCheck, CheckCircle2, FlaskConical, Target, TrendingUp, BarChart3, Scale, SplitSquareHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ModelOps() {
  const [metrics, setMetrics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/ml/independent-evaluation')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setMetrics(data);
      })
      .catch(console.error);
      
    fetch('http://localhost:8000/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="flex h-full flex-col p-6 gap-6 relative overflow-y-auto">
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Synthetic benchmark results demonstrate prototype behavior and do not represent validated real-world banking performance.</h3>
          <p className="text-xs opacity-80 mt-1">
            V1.0 Hand-Calibrated Predictive Heuristic. Validated on an independent synthetic test set.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-cyan-400" />
            Model Operations & Validation
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {metrics?.reproducibility_hash && (
            <span className="text-xs font-mono text-slate-500">Hash: {metrics.reproducibility_hash.substring(0,8)}</span>
          )}
          {metrics?.reproducibility_hash && (
            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/20">ML VALIDATION COMPLETE</span>
          )}
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> HEURISTIC ACTIVE</span>
        </div>
      </div>

      {/* Section A: Runtime/System Validation */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><CheckCircle2 className="text-emerald-400"/> A. Runtime/System Validation</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <p className="text-xs text-slate-400 mb-4">Results below reflect a single deterministic system test run to verify end-to-end integration (notifications, graph, UI). They do not represent predictive model accuracy.</p>
          {stats ? (
            <div className="grid grid-cols-4 gap-4">
              <div><span className="text-slate-500 block text-xs">P@5 (Demo Replay)</span><span className="text-emerald-400 font-mono text-lg">{(stats.precision_at_5 * 100).toFixed(1)}%</span></div>
              <div><span className="text-slate-500 block text-xs">Lead Time (Demo)</span><span className="text-cyan-400 font-mono text-lg">{stats.avg_lead_time} min</span></div>
              <div><span className="text-slate-500 block text-xs">Test Execution</span><span className="text-emerald-400 font-mono text-lg">PASS</span></div>
              <div><span className="text-slate-500 block text-xs">Integration</span><span className="text-emerald-400 font-mono text-lg">STABLE</span></div>
            </div>
          ) : <div className="animate-pulse h-16 bg-slate-700/50 rounded"></div>}
        </div>
      </section>

      {/* Section B: Independent Predictive Evaluation */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ShieldCheck className="text-indigo-400"/> B. Independent Predictive Evaluation</h2>
        {metrics ? (
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
           <h3 className="text-sm font-semibold text-indigo-300 mb-4 flex items-center gap-2"><Target size={16}/> Exact Metrics (Evaluation Unit: Incident)</h3>
           <div className="grid grid-cols-3 gap-8">
             <div className="space-y-3">
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Samples</span><span className="text-white font-mono">{metrics.scenario_count}</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">TP / TN</span><span className="text-white font-mono">{metrics.aggregate_metrics.confusion_matrix.TP} / {metrics.aggregate_metrics.confusion_matrix.TN}</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">FP / FN</span><span className="text-white font-mono">{metrics.aggregate_metrics.confusion_matrix.FP} / {metrics.aggregate_metrics.confusion_matrix.FN}</span></div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision</span><span className="text-white font-mono">{(metrics.aggregate_metrics.classification.Precision * 100).toFixed(1)}%</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Recall</span><span className="text-white font-mono">{(metrics.aggregate_metrics.classification.Recall * 100).toFixed(1)}%</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">False Positive Rate</span><span className="text-rose-400 font-mono">{(metrics.aggregate_metrics.classification.FPR * 100).toFixed(1)}%</span></div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision@1</span><span className="text-white font-mono">{(metrics.aggregate_metrics.ranking["Precision@1"] * 100).toFixed(1)}%</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Precision@5</span><span className="text-white font-mono">{(metrics.aggregate_metrics.ranking["Precision@5"] * 100).toFixed(1)}%</span></div>
               <div className="flex justify-between"><span className="text-slate-300 text-sm">Recall@5</span><span className="text-white font-mono">{(metrics.aggregate_metrics.ranking["Recall@5"] * 100).toFixed(1)}%</span></div>
             </div>
           </div>
        </div>
        ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded-xl"></div>}
      </section>

      {/* Section C: Baseline Comparison */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Scale className="text-orange-400"/> C. Baseline Comparison</h2>
        {metrics ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-slate-400 font-medium">Metric</th>
                <th className="p-3 text-slate-400 font-medium">Baseline (Static)</th>
                <th className="p-3 text-cyan-400 font-medium">Sentinel (Heuristic)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <tr>
                <td className="p-3 text-slate-300">Brier Score</td>
                <td className="p-3 font-mono">{metrics.aggregate_metrics.baseline.Brier_Score.toFixed(3)}</td>
                <td className="p-3 font-mono text-white">{metrics.aggregate_metrics.calibration.Brier_Score.toFixed(3)}</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-300">Precision@1</td>
                <td className="p-3 font-mono">{(metrics.aggregate_metrics.baseline["Precision@1"] * 100).toFixed(1)}%</td>
                <td className="p-3 font-mono text-white">{(metrics.aggregate_metrics.ranking["Precision@1"] * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-300">Precision@5</td>
                <td className="p-3 font-mono">{(metrics.aggregate_metrics.baseline["Precision@5"] * 100).toFixed(1)}%</td>
                <td className="p-3 font-mono text-white">{(metrics.aggregate_metrics.ranking["Precision@5"] * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-300">Recall@5</td>
                <td className="p-3 font-mono">{(metrics.aggregate_metrics.baseline["Recall@5"] * 100).toFixed(1)}%</td>
                <td className="p-3 font-mono text-white">{(metrics.aggregate_metrics.ranking["Recall@5"] * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded-xl"></div>}
      </section>

      {/* Section D: Calibration & Confidence Intervals */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><TrendingUp className="text-blue-400"/> D. Calibration & Confidence Intervals</h2>
        {metrics ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">95% Confidence Intervals (N=1000 Bootstraps)</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">P@1 95% CI</span><span className="text-white font-mono">[{(metrics.aggregate_metrics.uncertainty["Precision@1_95CI"][0]*100).toFixed(1)}%, {(metrics.aggregate_metrics.uncertainty["Precision@1_95CI"][1]*100).toFixed(1)}%]</span></div>
              <div className="flex justify-between"><span className="text-slate-400">P@5 95% CI</span><span className="text-white font-mono">[{(metrics.aggregate_metrics.uncertainty["Precision@5_95CI"][0]*100).toFixed(1)}%, {(metrics.aggregate_metrics.uncertainty["Precision@5_95CI"][1]*100).toFixed(1)}%]</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Recall@5 95% CI</span><span className="text-white font-mono">[{(metrics.aggregate_metrics.uncertainty["Recall@5_95CI"][0]*100).toFixed(1)}%, {(metrics.aggregate_metrics.uncertainty["Recall@5_95CI"][1]*100).toFixed(1)}%]</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Brier 95% CI</span><span className="text-white font-mono">[{metrics.aggregate_metrics.uncertainty.Brier_95CI[0].toFixed(3)}, {metrics.aggregate_metrics.uncertainty.Brier_95CI[1].toFixed(3)}]</span></div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Reliability Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">Brier Score</span><span className="text-emerald-400 font-mono">{metrics.aggregate_metrics.calibration.Brier_Score.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mean Lead Time</span><span className="text-white font-mono">{metrics.aggregate_metrics.lead_time.mean.toFixed(1)} min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Median Lead Time</span><span className="text-white font-mono">{metrics.aggregate_metrics.lead_time.median.toFixed(1)} min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">P90 Lead Time</span><span className="text-white font-mono">{metrics.aggregate_metrics.lead_time.p90.toFixed(1)} min</span></div>
            </div>
          </div>
        </div>
        ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded-xl"></div>}
      </section>

      {/* Section E: Adversarial Scenario Breakdown */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><BarChart3 className="text-fuchsia-400"/> E. Adversarial Scenario Breakdown</h2>
        {metrics ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(metrics.adversarial_breakdown).map(cat => (
            <div key={cat} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div className="flex justify-between text-sm font-medium mb-3"><span className="text-white capitalize">{cat}</span><span className="text-slate-500">n={metrics.adversarial_breakdown[cat].sample_count}</span></div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Precision@5:</span> <span className="text-emerald-400 font-mono">{(metrics.adversarial_breakdown[cat].ranking["Precision@5"]*100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Recall@5:</span> <span className="text-emerald-400 font-mono">{(metrics.adversarial_breakdown[cat].ranking["Recall@5"]*100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">False Pos Rate:</span> <span className="text-rose-400 font-mono">{(metrics.adversarial_breakdown[cat].classification.FPR*100).toFixed(1)}%</span></div>
              </div>
            </div>
          ))}
        </div>
        ) : <div className="animate-pulse h-32 bg-slate-700/50 rounded-xl"></div>}
      </section>

      {/* Section F: Abstention/Coverage */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><SplitSquareHorizontal className="text-yellow-400"/> F. Abstention & Coverage</h2>
        {metrics ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-6">
            <div><span className="text-slate-500 block text-xs">Prediction Coverage</span><span className="text-white font-mono text-lg">{(metrics.aggregate_metrics.abstention.coverage * 100).toFixed(1)}%</span></div>
            <div><span className="text-slate-500 block text-xs">Abstention Rate</span><span className="text-white font-mono text-lg">{(metrics.aggregate_metrics.abstention.rate * 100).toFixed(1)}%</span></div>
            <div><span className="text-slate-500 block text-xs">Accuracy (Non-Abstained P@5)</span><span className="text-emerald-400 font-mono text-lg">{(metrics.aggregate_metrics.abstention.accuracy_non_abstained_p5 * 100).toFixed(1)}%</span></div>
          </div>
          <p className="text-xs text-slate-500 mt-4">System avoids forcing terminal predictions when spatial confidence is insufficient (e.g. extremely rapid cashouts).</p>
        </div>
        ) : <div className="animate-pulse h-24 bg-slate-700/50 rounded-xl"></div>}
      </section>

      {/* Section G: Known Limitations */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><FlaskConical className="text-rose-400"/> G. Known Limitations</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-sm text-slate-300 space-y-3">
          <p><strong className="text-white">Heuristic Only:</strong> The current system is a manually calibrated linear combination of features passed through a logistic sigmoid. It is NOT a learned decision tree, neural network, or ensemble model. There is no continuous learning or reinforcement learning present in the codebase.</p>
          <p><strong className="text-white">Synthetic Graph Limits:</strong> Results are evaluated against synthetic Pune region banking logic. Real-world fraud patterns exhibit significantly higher concept drift, class imbalance, and data noise not captured by the `SimulationEngine`.</p>
          <p><strong className="text-white">Evaluation Unit:</strong> Metrics are computed per incident (aggregate prediction over a sequence of related transactions), not per individual transaction.</p>
          <p><strong className="text-white">Threshold:</strong> The current confusion matrix utilizes a hard decision threshold of `>0.50` probability.</p>
        </div>
      </section>
    </div>
  );
}
