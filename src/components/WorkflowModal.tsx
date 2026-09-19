import { X, CheckCircle2, ArrowDown, Cpu, AlertTriangle, ShieldCheck, FileSpreadsheet, FileText, Send, Radio } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowModal({ isOpen, onClose }: WorkflowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 rounded-full border border-sky-100 mb-2">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>Core Operational Architecture</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              AI AUTOMATION WORKFLOW
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Transforming manual municipal leak triage into high-speed predictive hydraulic intelligence.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Value Automation Focus */}
        <div className="my-6 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50 border border-sky-200/80">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0 mt-0.5 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sky-900 uppercase tracking-wide">
                THE ONE HIGH-VALUE STEP WE AUTOMATE
              </h3>
              <p className="text-sm text-slate-700 font-medium mt-1">
                Manual analysis, hydraulic divergence correlation, and risk prioritization of pressure/flow anomalies across distributed district metered areas (DMAs).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Manual Process */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                CURRENT MANUAL PROCESS (Hours to Days)
              </h3>
            </div>
            <ol className="space-y-3 text-xs text-slate-700">
              {[
                'Engineer receives disparate pressure and flow telemetry files.',
                'Engineer manually reviews data from different network zones.',
                'Engineer plots & compares actual readings against seasonal expected curves.',
                'Engineer visually searches for suspicious hydraulic anomalies.',
                'Engineer manually calculates empirical estimates of lost water volume.',
                'Engineer subjectively decides which suspected leak should be visited first.',
                'Engineer manually drafts a written investigation and repair memo.',
                'Engineer faxes or emails the report to dispatch workers.',
              ].map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-semibold text-slate-400 shrink-0 w-5">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Automated Process */}
          <div className="p-5 rounded-xl bg-sky-50/70 border border-sky-200">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-sky-200">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
              <h3 className="font-bold text-sky-950 text-sm tracking-wide">
                NEXORA AI AUTOMATED PROCESS (&lt; 2 Seconds)
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { title: 'CSV Sensor Telemetry Data', icon: FileSpreadsheet },
                { title: 'Import into SQLite Database', icon: CheckCircle2 },
                { title: 'Analyze Pressure + Flow Divergence', icon: Radio },
                { title: 'Detect Abnormal Hydraulic Zones', icon: AlertTriangle },
                { title: 'Estimate Potential Water Loss (L/day)', icon: CheckCircle2 },
                { title: 'Calculate Prototype Leak Risk & Confidence', icon: ShieldCheck },
                { title: 'Rank Suspected Leaks by Priority Score', icon: CheckCircle2 },
                { title: 'AI Generates Investigation Recommendation', icon: Cpu },
                { title: 'Engineer Reviews Contextual AI Dossier', icon: FileText },
                { title: 'Download Formal PDF Engineering Report', icon: FileText },
                { title: 'Dispatch Directly to Field Worker Team', icon: Send },
                { title: 'Track Real-time Dispatch Status in Portal', icon: CheckCircle2 },
              ].map((item, idx, arr) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-sky-100 shadow-xs text-xs font-medium text-slate-800">
                    <item.icon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowDown className="w-3 h-3 text-sky-400 my-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Nexora AI Architecture: Deterministic Hydraulic Scoring + Explanatory Generative AI
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Architecture View
          </button>
        </div>
      </div>
    </div>
  );
}
