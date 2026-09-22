'use client';
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
      const [statsRes, incRes] = await Promise.all([
        fetch('http://localhost:8000/api/stats'),
        fetch('http://localhost:8000/api/incidents')
      ]);
      const data = await statsRes.json();
      const incidents = await incRes.json();

      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const primaryColor: [number, number, number] = [8, 145, 178];
      const secondaryColor: [number, number, number] = [225, 29, 72];
      const textColor: [number, number, number] = [30, 41, 59];
      const textLightColor: [number, number, number] = [100, 116, 139];

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 100, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CyberCash Intelligence Report', 40, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);
      doc.text(`Classification: CONFIDENTIAL / LEA CLEARANCE ONLY`, 40, 85);

      // Executive Summary
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive AI Analytics Summary', 40, 140);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textLightColor[0], textLightColor[1], textLightColor[2]);
      
      const summaryText = `This report provides a real-time snapshot of the CyberCash AI Fraud Detection engine. The system has evaluated ${data.total_evaluated || 0} transaction sequences, successfully predicting localized cashout threats with an average advance warning time of ${data.avg_lead_time || 0} minutes. Total physical threat vectors currently monitored amount to INR ${(data.amount_at_risk || 0).toLocaleString()} at risk across ${data.active_incidents || 0} isolated incident clusters. The machine learning pipeline maintains an accuracy of ${((data.precision_at_5 || 0) * 100).toFixed(1)}% precision on top-5 target predictions with an average spatial targeting error of only ${data.avg_geo_error || 0}km.`;
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 80);
      doc.text(splitSummary, 40, 165);

      let currentY = 165 + (splitSummary.length * 15) + 20;

      // KPIs
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('2. Key Performance Indicators (KPIs)', 40, currentY);
      currentY += 15;

      const kpiData = [
        ['Active Threat Incidents', String(data.active_incidents || 0)],
        ['Total Incidents Evaluated', String(data.total_evaluated || 0)],
        ['Total Value at Risk', `INR ${(data.amount_at_risk || 0).toLocaleString()}`],
        ['AI Prediction Precision (Top-5)', `${((data.precision_at_5 || 0) * 100).toFixed(1)}%`],
        ['Avg Geospatial Error Margin', `${data.avg_geo_error || 0} km`],
        ['Average Lead Time / Warning', `${data.avg_lead_time || 0} mins`]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Recorded Value']],
        body: kpiData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        columnStyles: {
          0: { cellWidth: 300, fontStyle: 'bold' },
          1: { cellWidth: 200 }
        },
        styles: { fontSize: 10, cellPadding: 8 }
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 30;

      // Incidents
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('3. Active High-Risk Intelligence Dossiers', 40, currentY);
      currentY += 15;

      const sortedIncidents = incidents
        .sort((a: any, b: any) => {
           if (a.risk_level === 'HIGH' && b.risk_level !== 'HIGH') return -1;
           if (a.risk_level !== 'HIGH' && b.risk_level === 'HIGH') return 1;
           return 0;
        })
        .slice(0, 15);

      const incidentsData = sortedIncidents.map((inc: any) => [
        inc.id.substring(0, 8),
        inc.incident_type.replace('_', ' '),
        inc.risk_level,
        inc.status,
        `INR ${inc.amount_at_risk.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Incident ID', 'Threat Typology', 'Risk Level', 'Status', 'Value at Risk']],
        body: incidentsData,
        theme: 'striped',
        headStyles: { fillColor: secondaryColor, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 6 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 2) {
             if (data.cell.raw === 'HIGH') {
               data.cell.styles.textColor = [225, 29, 72];
               data.cell.styles.fontStyle = 'bold';
             }
          }
        }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`CyberCash Intelligence Systems | Restricted Distribution | Page ${i} of ${pageCount}`, 40, doc.internal.pageSize.getHeight() - 20);
      }

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
