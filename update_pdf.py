import os

CODE = r"""'use client';
import { FileText, Download, Activity, Target, Clock, ShieldAlert, Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(e => console.error(e));
  }, []);

  const generatePDF = async () => {
    setLoadingPdf(true);
    try {
      const statsRes = await fetch('http://localhost:8000/api/stats');
      const data = await statsRes.json();

      const doc = new jsPDF('p', 'pt', 'a4');
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      const darkBg = [11, 19, 32];
      const darkBox = [21, 33, 54];
      const cyan = [0, 195, 217];
      
      const drawHeaderAndFooter = (pageNum: number) => {
        doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
        doc.rect(0, 0, width, 40, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CYBERCASH SENTINEL', 40, 25);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200);
        doc.text('MHA / I4C PROTOTYPE | PREDICTIVE CYBER-FRAUD INTELLIGENCE', width - 40, 25, { align: 'right' });
        
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text('CONFIDENTIAL — AUTHORIZED PERSONNEL ONLY', 40, height - 30);
        doc.text(`Page ${pageNum}`, width - 40, height - 30, { align: 'right' });
        doc.setDrawColor(220);
        doc.setLineWidth(1);
        doc.line(40, height - 45, width - 40, height - 45);
      };

      const drawPageTitle = (title: string, subtitle: string, y: number) => {
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 40, y);
        
        if (subtitle) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(subtitle, 40, y + 20);
        }
        
        doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
        doc.setLineWidth(3);
        doc.line(40, y + 35, width - 40, y + 35);
        return y + 60;
      };

      const renderTable = (startY: number, head: string[][], body: string[][], colStyles?: any) => {
        autoTable(doc, {
          startY,
          head,
          body,
          theme: 'grid',
          headStyles: { fillColor: darkBg, textColor: 255, fontStyle: 'bold', cellPadding: 10 },
          bodyStyles: { textColor: [50, 50, 50], cellPadding: 10 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: colStyles || {},
          margin: { left: 40, right: 40 }
        });
        // @ts-ignore
        return doc.lastAutoTable.finalY + 30;
      };

      // ==== PAGE 1: COVER ====
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.rect(0, 0, width, height, 'F');
      
      doc.setFillColor(6, 45, 75);
      doc.circle(width, 0, 300, 'F');
      doc.circle(0, height, 200, 'F');
      
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CYBERCASH SENTINEL', 40, 140);
      
      doc.setTextColor(255);
      doc.setFontSize(32);
      doc.text('Predictive Cyber-Fraud', 40, 200);
      doc.text('Intelligence Report', 40, 240);
      
      doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
      doc.setLineWidth(4);
      doc.line(40, 270, 200, 270);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200);
      const sub = doc.splitTextToSize('Real-time prediction of potential cash-out activity, expected time windows and likely withdrawal locations for proactive cyber-fraud intervention.', width - 100);
      doc.text(sub, 40, 310);
      
      doc.setFillColor(darkBox[0], darkBox[1], darkBox[2]);
      doc.roundedRect(40, 400, width - 80, 180, 10, 10, 'F');
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text('REPORT INFORMATION', 60, 430);
      
      doc.setTextColor(255);
      doc.text('Report Type', 60, 480);
      doc.text('Predictive Intelligence Assessment', 200, 480);
      doc.text('Data Source', 60, 520);
      doc.text('Synthetic Simulation', 200, 520);
      doc.text('Model Version', 60, 560);
      doc.text('V1.0 Calibrated', 200, 560);
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 650);
      doc.text('MHA / I4C Prototype — Demonstration Environment', 40, height - 40);
      doc.text('CONFIDENTIAL — AUTHORIZED PERSONNEL ONLY', width - 40, height - 40, { align: 'right' });
      
      // ==== PAGE 2: EXECUTIVE SUMMARY ====
      doc.addPage();
      drawHeaderAndFooter(2);
      let cy = drawPageTitle('Executive Summary', 'Current intelligence and predictive assessment', 100);
      
      doc.setFontSize(11);
      doc.setTextColor(50);
      const p1 = doc.splitTextToSize('CyberCash Sentinel is a predictive cyber-fraud intelligence platform designed to support proactive intervention against financial cybercrime. The platform continuously evaluates financial activity, transaction behaviour, account relationships and geographic information to identify potential cash-out activity before the withdrawal occurs.', width - 80);
      doc.text(p1, 40, cy);
      cy += p1.length * 15 + 15;
      
      const p2 = doc.splitTextToSize('The system is designed around a Will–When–Where prediction approach. It estimates whether a cash-out is likely, determines an expected time window, and identifies the geographic region and candidate withdrawal locations that should receive attention.', width - 80);
      doc.text(p2, 40, cy);
      cy += p2.length * 15 + 30;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Current Evaluation Snapshot', 40, cy);
      cy += 25;
      
      const boxW = (width - 100) / 2;
      const boxH = 70;
      const formatCurrency = (amount: number) => {
        const formatter = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 });
        return `${formatter.format(amount)}`;
      };

      const metrics = [
        { label: 'ACTIVE INCIDENTS', val: String(data.active_incidents || 0), col: [225, 29, 72] },
        { label: 'INCIDENTS EVALUATED', val: String(data.total_evaluated || 0), col: [245, 158, 11] },
        { label: 'TOP-5 PRECISION', val: `${((data.precision_at_5 || 0) * 100).toFixed(1)}%`, col: [6, 182, 212] },
        { label: 'ADVANCE WARNING', val: `${data.avg_lead_time || 0} min`, col: [16, 185, 129] },
        { label: 'GEOGRAPHIC ERROR', val: `${data.avg_geo_error || 0} km`, col: [6, 182, 212] },
        { label: 'AMOUNT AT RISK', val: `${formatCurrency(data.amount_at_risk || 0)}`, col: [245, 158, 11] }
      ];
      
      for(let i=0; i<6; i++) {
        let x = 40 + (i%2)*(boxW + 20);
        let y = cy + Math.floor(i/2)*(boxH + 20);
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(2);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, boxW, boxH, 8, 8, 'FD');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(metrics[i].label, x + 15, y + 25);
        
        doc.setFontSize(22);
        doc.setTextColor(metrics[i].col[0], metrics[i].col[1], metrics[i].col[2]);
        doc.text(metrics[i].val, x + 15, y + 55);
      }
      
      cy += (3 * (boxH + 20)) + 20;
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('Operational Objective', 40, cy);
      cy += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p3 = doc.splitTextToSize('The objective is to convert incoming cyber-fraud signals into actionable intelligence for authorized law-enforcement and banking personnel. Rather than relying only on retrospective analysis, the platform provides early warning and ranked geographic targets that can support timely human review and intervention.', width - 80);
      doc.text(p3, 40, cy);

      // ==== PAGE 3: PREDICTIVE INTELLIGENCE ====
      doc.addPage();
      drawHeaderAndFooter(3);
      cy = drawPageTitle('Predictive Intelligence', 'How the platform converts financial activity into actionable intelligence', 100);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Will !’ When !’ Where', 40, cy);
      cy += 20;
      
      cy = renderTable(cy, 
        [['Prediction Dimension', 'System Output', 'Operational Meaning']],
        [
          ['Will', 'Cash-out likelihood', 'Estimates whether a cash withdrawal is likely to occur.'],
          ['When', 'Predicted time window', 'Provides an expected period in which cash-out activity may occur.'],
          ['Where', 'Region / H3 / ATM ranking', 'Narrows the physical search area to candidate withdrawal locations.']
        ],
        { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: 150 } }
      );
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Intelligence Pipeline', 40, cy);
      cy += 20;
      
      renderTable(cy,
        [['Step', 'Stage', 'Description']],
        [
          ['1', 'Incoming Signals', 'Transactions, complaints and account activity'],
          ['2', 'Behaviour Analysis', 'Frequency, velocity, amount and burst patterns'],
          ['3', 'Network Analysis', 'Relationships between accounts and transactions'],
          ['4', 'Geospatial Analysis', 'Regions, H3 cells and candidate ATMs'],
          ['5', 'Prediction', 'Risk, time window and Top-K locations'],
          ['6', 'Human Review', 'Authorized LEA / bank verification and action']
        ],
        { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } }
      );

      // ==== PAGE 4: MODEL EVALUATION ====
      doc.addPage();
      drawHeaderAndFooter(4);
      cy = drawPageTitle('Model Evaluation', 'Performance indicators from the current prototype evaluation', 100);
      
      cy = renderTable(cy,
        [['Metric', 'Current Value', 'Interpretation']],
        [
          ['Top-5 Precision', `${((data.precision_at_5 || 0) * 100).toFixed(1)}%`, 'Measures how often relevant locations appear within the top five predictions.'],
          ['Average Advance Warning', `${data.avg_lead_time || 0} min`, 'Average time between the prediction and the observed cash-out event in the current evaluation.'],
          ['Average Geographic Error', `${data.avg_geo_error || 0} km`, 'Distance between the predicted and actual geographic location.'],
          ['Incidents Evaluated', String(data.total_evaluated || 0), 'Number of incidents included in the current evaluation.']
        ],
        { 0: { cellWidth: 100 }, 1: { cellWidth: 80, fontStyle: 'bold' } }
      );
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Evaluation Approach', 40, cy);
      cy += 20;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p4 = doc.splitTextToSize('The platform is designed to evaluate predictions against confirmed outcomes rather than relying only on model confidence. Historical replay can be used to reconstruct what information would have been available at the prediction time and compare the resulting prediction with the later observed outcome.', width - 80);
      doc.text(p4, 40, cy);
      cy += p4.length * 15 + 30;
      
      doc.setTextColor(194, 65, 12);
      const p5 = doc.splitTextToSize('Important: the current prototype uses synthetic simulation data. The displayed metrics demonstrate prototype behaviour and should not be interpreted as validated real-world banking performance.', width - 80);
      doc.text(p5, 40, cy);

      // ==== PAGE 5: NETWORK & GEO ====
      doc.addPage();
      drawHeaderAndFooter(5);
      cy = drawPageTitle('Network & Geographic Intelligence', 'Connecting money movement with physical cash-out locations', 100);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Financial Network Analysis', 40, cy);
      cy += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p6 = doc.splitTextToSize('The platform does not treat transactions as isolated events. It analyzes relationships between accounts and transaction flows to identify connected entities and potential mule-account movement. This allows investigators to understand how funds are moving through the network before a potential cash-out.', width - 80);
      doc.text(p6, 40, cy);
      cy += p6.length * 15 + 40;
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(2);
      doc.roundedRect(60, cy, width - 120, 100, 10, 10, 'FD');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Victim Account            !’            Mule Account            !’            Cash-out Location', width/2, cy + 45, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Illustrative transaction relationship', width/2, cy + 75, { align: 'center' });
      
      cy += 140;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Geospatial Intelligence', 40, cy);
      cy += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p7 = doc.splitTextToSize('The geospatial layer narrows the prediction from a broad region to smaller geographic cells and finally to physically feasible candidate ATMs. PostGIS can support spatial queries while H3 provides a hierarchical geographic representation for location-based risk analysis.', width - 80);
      doc.text(p7, 40, cy);
      cy += p7.length * 15 + 20;
      
      renderTable(cy,
        [['Location Level', 'Purpose']],
        [
          ['Region', 'Identify the broader geographic area of potential cash-out.'],
          ['H3 Cell', 'Represent and rank localized geographic risk.'],
          ['Candidate ATM', 'Identify physically feasible withdrawal terminals.'],
          ['Top-K Locations', 'Provide a short ranked list for human investigation.']
        ],
        { 0: { cellWidth: 150 } }
      );

      // ==== PAGE 6: HUMAN-IN-THE-LOOP ====
      doc.addPage();
      drawHeaderAndFooter(6);
      cy = drawPageTitle('Human-in-the-Loop Response', 'Prediction is used as intelligence, not as an automatic final decision', 100);
      
      cy = renderTable(cy,
        [['Step', 'Stage', 'Description']],
        [
          ['01', 'Prediction', 'System generates cash-out risk and candidate locations.'],
          ['02', 'Alert', 'High-priority intelligence is surfaced to authorized personnel.'],
          ['03', 'Human Review', 'LEA or banking personnel review the available evidence.'],
          ['04', 'Action', 'The appropriate response is taken through authorized channels.'],
          ['05', 'Outcome', 'The actual cash-out or no-cash-out result is recorded.']
        ],
        { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } }
      );
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Why Human Verification Matters', 40, cy);
      cy += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p8 = doc.splitTextToSize('The platform is designed as a decision-support system. Predictions and alerts are reviewed by authorized personnel before operational action. This allows human investigators to combine model-generated intelligence with case context and other available evidence.', width - 80);
      doc.text(p8, 40, cy);

      // ==== PAGE 7: SECURITY & GOVERNANCE ====
      doc.addPage();
      drawHeaderAndFooter(7);
      cy = drawPageTitle('Security & Governance', 'Controls designed to protect sensitive cyber-fraud intelligence', 100);
      
      cy = renderTable(cy,
        [['Security Control', 'Purpose']],
        [
          ['Encryption', 'Protect sensitive data while stored and transmitted.'],
          ['RBAC / ABAC', 'Restrict information and actions according to user role and authorization attributes.'],
          ['mTLS', 'Authenticate and protect communication between trusted services.'],
          ['PII Protection', 'Use controlled handling, pseudonymization and tokenization for sensitive information.'],
          ['KMS', 'Securely manage cryptographic keys used for protected data.'],
          ['Audit Trails', 'Record important access and operational actions for accountability and traceability.'],
          ['Secure Access', 'Protect APIs, dashboards and internal services from unauthorized access.'],
          ['Model Security', 'Control access to model files, versions, configuration and deployment.']
        ],
        { 0: { cellWidth: 150 } }
      );
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Auditability', 40, cy);
      cy += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p9 = doc.splitTextToSize('An investigation platform must provide traceability for sensitive operations. Audit records can capture events such as authentication, access to case information, viewing predictions, report generation, configuration changes and model deployment activities.', width - 80);
      doc.text(p9, 40, cy);

      // ==== PAGE 8: CONTINUOUS IMPROVEMENT ====
      doc.addPage();
      drawHeaderAndFooter(8);
      cy = drawPageTitle('Continuous Model Improvement', 'Closing the loop between predictions and confirmed real-world outcomes', 100);
      
      cy = renderTable(cy,
        [['Stage', 'Description']],
        [
          ['1', 'Prediction', 'System generates a cash-out prediction.'],
          ['2', 'Actual Outcome', 'Cash-out or no cash-out is later confirmed.'],
          ['3', 'Model Monitoring', 'Performance, drift and calibration are evaluated.'],
          ['4', 'Controlled Retraining', 'New verified data can be used to retrain the model.'],
          ['5', 'Validation', 'The updated model is tested before deployment.'],
          ['6', 'Versioned Deployment', 'The approved model becomes the next controlled version.']
        ],
        { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } }
      );
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Point-in-Time Training', 40, cy);
      cy += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p10 = doc.splitTextToSize('Training data is constructed so that the model only receives information that would have been available at the moment of prediction. The later cash-out outcome is kept separate and used as the ground truth. This prevents future information from leaking into the prediction process.', width - 80);
      doc.text(p10, 40, cy);

      // ==== PAGE 9: CONCLUSION ====
      doc.addPage();
      drawHeaderAndFooter(9);
      cy = drawPageTitle('Conclusion', 'Predictive intelligence for proactive cyber-fraud intervention', 100);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      const p11 = doc.splitTextToSize('CyberCash Sentinel is designed to move cyber-fraud response from retrospective investigation toward proactive intelligence. The platform combines transaction behaviour, temporal patterns, fraud-network relationships and geographic information to predict potential cash-out activity before it occurs.\n\nThe core intelligence is structured around three questions: Will a cash-out happen? When is it likely to happen? Where is it likely to happen? The system then converts these predictions into ranked candidate locations and delivers them to authorized personnel for human verification and action.\n\nConfirmed outcomes provide feedback for monitoring and controlled model improvement, allowing the platform to evolve as transaction and fraud behaviour changes.', width - 80);
      doc.text(p11, 40, cy);
      cy += p11.length * 15 + 40;
      
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.roundedRect(40, cy, width - 80, 120, 10, 10, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.text('CORE INNOVATION', 60, cy + 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255);
      const p12 = doc.splitTextToSize('Connecting fraud-network intelligence with temporal and geospatial prediction to produce actionable Will–When–Where cash-out intelligence.', width - 120);
      doc.text(p12, 60, cy + 70);
      
      cy += 160;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DEMO NOTICE: This report contains synthetic prototype data and is intended for demonstration purposes.', 40, cy);

      // Save
      doc.save(`CyberCash_Intelligence_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF report.');
    } finally {
      setLoadingPdf(false);
    }
  };

  const statCards = [
    { label: 'Active Incidents', value: stats?.active_incidents || 0, icon: Activity, color: 'text-rose-400' },
    { label: 'Total Incidents Evaluated', value: stats?.total_evaluated || 0, icon: ShieldAlert, color: 'text-amber-400' },
    { label: 'Top-5 Precision', value: `${((stats?.precision_at_5 || 0) * 100).toFixed(1)}%`, icon: Target, color: 'text-cyan-400' },
    { label: 'Avg Advance Warning', value: `${stats?.avg_lead_time || 0} min`, icon: Clock, color: 'text-emerald-400' },
    { label: 'Avg Geo Error', value: `${stats?.avg_geo_error || 0} km`, icon: Crosshair, color: 'text-indigo-400' },
  ];

  return (
    <div className="flex h-full flex-col p-6 gap-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-cyan-400" />
          Intelligence Reports
        </h1>
        <button 
          onClick={generatePDF}
          disabled={loadingPdf}
          className={`flex items-center gap-2 px-4 py-2 ${loadingPdf ? 'bg-cyan-800 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-cyan-900/20`}
        >
          <Download size={16} /> {loadingPdf ? 'Generating PDF...' : 'Export Intelligence PDF'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-y-auto">
           <h3 className="text-lg font-semibold text-white mb-6">Live Evaluation Metrics</h3>
           {stats ? (
             <div className="grid grid-cols-3 gap-6 text-sm">
               {statCards.map((c, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4">
                     <div className="text-slate-400 font-medium uppercase tracking-wider text-xs">{c.label}</div>
                     <c.icon size={18} className={c.color} />
                   </div>
                   <div className="text-3xl text-white font-mono font-bold">{c.value}</div>
                 </div>
               ))}
               <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-4">
                     <div className="text-slate-400 font-medium uppercase tracking-wider text-xs">Total At Risk</div>
                   </div>
                   <div className="text-2xl text-amber-400 font-mono font-bold">
                     ₹{(stats?.amount_at_risk || 0).toLocaleString()}
                   </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center justify-center p-12 text-slate-500">Loading intelligence metrics...</div>
           )}
        </div>
        
        <div className="col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
           <h3 className="text-lg font-semibold text-white mb-6">Generated Reports</h3>
           <ul className="space-y-4">
             {['Daily Threat Briefing', 'Weekly Ops Summary', 'Mule Network Analysis', 'ATM Hotspot Report'].map((title, i) => (
               <li key={i} onClick={generatePDF} className="group p-4 bg-slate-900 rounded-xl hover:border-cyan-500/50 border border-slate-700 transition-colors cursor-pointer">
                 <div className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition">{title}</div>
                 <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                   <span>PDF Document</span>
                   <span>{(i*2 + 1)}h ago</span>
                 </div>
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
}
"""

with open('frontend/src/app/reports/page.tsx', 'w', encoding='utf-8') as f:
    f.write(CODE)
