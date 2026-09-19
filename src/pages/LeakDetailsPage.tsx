import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Download,
  Droplets,
  FileText,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Waves,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { LeakResult, SensorReading, AiInvestigationReport, WorkerDispatchRecord } from '../types';

export function LeakDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [leak, setLeak] = useState<LeakResult | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [aiReport, setAiReport] = useState<AiInvestigationReport | null>(null);
  const [dispatch, setDispatch] = useState<WorkerDispatchRecord | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [sendingDispatch, setSendingDispatch] = useState<boolean>(false);

  // Dispatch Form State
  const [workerTeam, setWorkerTeam] = useState<string>('Maintenance Team B (Acoustic Correlators)');
  const [dispatchPriority, setDispatchPriority] = useState<string>('Critical');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchLeakDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getLeakById(Number(id));
      setLeak(res.leak);
      setReadings(res.leak.readings || []);
      if (res.leak.ai_report) {
        setAiReport(res.leak.ai_report);
        setDispatchMessage(res.leak.ai_report.worker_instructions || '');
      }
      if (res.leak.dispatch) {
        setDispatch(res.leak.dispatch);
      }
    } catch (err: any) {
      console.error('Failed to load leak details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeakDetails();
  }, [id]);

  // Real-time automatic sync when new 5-minute SCADA packet is received
  useEffect(() => {
    const handleTelemetryPacket = (e: any) => {
      const packet = e.detail?.packet;
      if (!packet || !leak) return;

      const zoneReading = packet.readings?.find((r: SensorReading) => r.zone === leak.zone);
      if (zoneReading) {
        setReadings((prev) => {
          const exists = prev.some((r) => r.timestamp === zoneReading.timestamp);
          if (exists) return prev;
          return [...prev, zoneReading];
        });
        setLeak((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            actual_pressure: zoneReading.pressure,
            actual_flow: zoneReading.flow,
          };
        });
        setFeedback({
          message: `Live SCADA update: 5-minute packet received for Zone ${leak.zone} (P: ${zoneReading.pressure.toFixed(1)} bar, F: ${zoneReading.flow.toFixed(1)} m³/h). Chart updated.`,
          type: 'success',
        });
      }
    };

    window.addEventListener('scada-telemetry-packet', handleTelemetryPacket);
    return () => {
      window.removeEventListener('scada-telemetry-packet', handleTelemetryPacket);
    };
  }, [leak]);

  const handleGenerateAiReport = async () => {
    if (!leak) return;
    try {
      setGeneratingAi(true);
      const res = await api.generateAiReport(leak.id);
      setAiReport(res.report);
      setDispatchMessage(res.report.worker_instructions);
      setFeedback({
        message: 'AI-Assisted Investigation Recommendation generated successfully.',
        type: 'success',
      });
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to generate AI report.',
        type: 'error',
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSendDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leak) return;

    try {
      setSendingDispatch(true);
      const res = await api.createDispatch({
        leak_id: leak.id,
        report_id: aiReport?.id || null,
        worker_team: workerTeam,
        priority: dispatchPriority,
        message: dispatchMessage,
      });

      setDispatch(res.dispatch);
      setLeak((prev) => (prev ? { ...prev, status: 'Dispatched' } : null));
      setIsDispatchModalOpen(false);
      setFeedback({
        message: res.message || `Report successfully sent to ${workerTeam}.`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to dispatch report.',
        type: 'error',
      });
    } finally {
      setSendingDispatch(false);
    }
  };

  if (loading || !leak) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Droplets className="w-10 h-10 animate-bounce text-sky-600" />
        <p className="text-base font-semibold text-slate-700">Loading leak telemetry dossier...</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = readings.map((r) => ({
    time: r.timestamp.includes(' ') ? r.timestamp.split(' ')[1] : r.timestamp,
    actualPressure: r.pressure,
    expectedPressure: r.expected_pressure,
    actualFlow: r.flow,
    expectedFlow: r.expected_flow,
  }));

  const isCritical = leak.status === 'CRITICAL';
  const isDispatched = leak.status === 'Dispatched' || Boolean(dispatch);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/leaks"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Priority Queue</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Telemetry Status:</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Live Synced
          </span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2
              className={`w-5 h-5 ${feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
            />
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Profile */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                isCritical
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              Priority #{leak.rank || 1}
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                isDispatched
                  ? 'bg-blue-100 text-blue-800'
                  : isCritical
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isDispatched ? 'Status: Dispatched' : `Status: ${leak.status}`}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Zone {leak.zone} Telemetry Investigation
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Suspected pipeline anomaly detected at {leak.detected_at} (Coordinates: {leak.latitude || '30.3501'}° N, {leak.longitude || '76.8302'}° E)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateAiReport}
            disabled={generatingAi}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-sm shadow-sky-600/30 disabled:opacity-60"
          >
            <Sparkles className={`w-4 h-4 ${generatingAi ? 'animate-spin' : ''}`} />
            <span>{generatingAi ? 'Generating AI Report...' : 'GENERATE AI INVESTIGATION REPORT'}</span>
          </button>

          {aiReport && (
            <>
              <a
                href={api.getPdfDownloadUrl(leak.id)}
                download={`NexoraAI_${leak.zone}_Investigation_Report.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>DOWNLOAD PDF REPORT</span>
              </a>

              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>{isDispatched ? 'UPDATE DISPATCH' : 'SEND TO WORKERS'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hydraulic Diagnostics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Estimated Loss
          </span>
          <span className="text-xl font-black text-rose-700 block">
            {leak.estimated_loss.toLocaleString()} L/day
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {(leak.estimated_loss / 1000).toFixed(1)} m³/day
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Leak Confidence
          </span>
          <span className="text-xl font-black text-sky-700 block">
            {leak.confidence}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Statistical fit</span>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pressure Anomaly
          </span>
          <span className="text-xl font-black text-rose-600 block">
            -{leak.pressure_anomaly}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Head deficit</span>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Flow Surge
          </span>
          <span className="text-xl font-black text-rose-600 block">
            +{leak.flow_anomaly}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Unmetered draw</span>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Actual Pressure
          </span>
          <span className="text-xl font-black text-slate-900 block">
            {leak.actual_pressure || 34.0} bar
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Expected: {leak.expected_pressure || 50.0} bar
          </span>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Actual Flow
          </span>
          <span className="text-xl font-black text-slate-900 block">
            {leak.actual_flow || 131.0} m³/h
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Expected: {leak.expected_flow || 100.0} m³/h
          </span>
        </div>
      </div>

      {/* Hydraulic Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pressure Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Pressure Gradient (Actual vs Expected)</span>
              </h3>
              <p className="text-xs text-slate-500">Observed sustained drop indicating pipe rupture.</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Unit: bar
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="expectedPressure"
                  name="Expected Pressure"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actualPressure"
                  name="Actual Pressure (Observed)"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#dc2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Flow Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>Mainline Flow Rate (Actual vs Expected)</span>
              </h3>
              <p className="text-xs text-slate-500">Abnormal flow surge exceeding diurnal consumption baselines.</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Unit: m³/h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="expectedFlow"
                  name="Expected Baseline Flow"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actualFlow"
                  name="Actual Mainline Flow"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI-Assisted Investigation Recommendation Section */}
      {aiReport ? (
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white to-slate-50 border-2 border-sky-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-sky-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Automated Engineering Dossier
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  AI-Assisted Investigation Recommendation
                </h2>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              Model: Gemini 3.8 Flash Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part 1: Anomaly Summary */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>1. Anomaly Summary</span>
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {aiReport.anomaly_summary}
              </p>
            </div>

            {/* Part 2: Why Zone is Suspicious */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>2. Why This Zone Is Suspicious</span>
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {aiReport.why_suspicious}
              </p>
            </div>

            {/* Part 3: Estimated Impact */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>3. Estimated Impact</span>
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {aiReport.estimated_impact}
              </p>
            </div>

            {/* Part 4: Priority Explanation */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>4. Priority Explanation</span>
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {aiReport.priority_explanation}
              </p>
            </div>
          </div>

          {/* Part 5 & 6: Suggested Pipeline & Recommended Action */}
          <div className="p-5 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 block mb-1">
                5 & 6. Suggested Pipeline Segment & Inspection Action
              </span>
              <p className="text-sm font-bold text-slate-900 mb-1">
                Target Corridor: {aiReport.suggested_pipeline_segment}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {aiReport.recommended_inspection_action}
              </p>
            </div>
          </div>

          {/* Part 7: Short Worker Instructions */}
          <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
              7. Short Worker-Facing Instructions
            </span>
            <p className="text-sm text-emerald-950 font-medium leading-relaxed">
              {aiReport.worker_instructions}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> AI-Assisted Investigation Recommendation. Physical confirmation by a qualified field engineer is required prior to excavation. Measurements reflect prototype estimated water loss calculations.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-sky-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            AI Investigation Report Not Yet Generated
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "GENERATE AI INVESTIGATION REPORT" above to synthesize hydraulic telemetry, quantify loss, and generate field crew inspection instructions.
          </p>
        </div>
      )}

      {/* Worker Dispatch Status (if already dispatched) */}
      {dispatch && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Active Field Dispatch: {dispatch.report_code}
              </div>
              <h4 className="text-sm font-extrabold text-blue-950">
                Assigned to {dispatch.worker_team} (Priority: {dispatch.priority})
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Dispatched at {new Date(dispatch.dispatched_at).toLocaleString()}
              </p>
            </div>
          </div>

          <Link
            to="/dispatches"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-800 bg-white hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <span>View in Dispatch History</span>
          </Link>
        </div>
      )}

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Field Operations Crew
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Dispatch Report: Zone {leak.zone}
                </h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDispatch} className="space-y-4 mt-4">
              {/* Team selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maintenance Team
                </label>
                <select
                  value={workerTeam}
                  onChange={(e) => setWorkerTeam(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  <option value="Maintenance Team A (Rapid Response)">Maintenance Team A (Rapid Response)</option>
                  <option value="Maintenance Team B (Acoustic Correlators)">Maintenance Team B (Acoustic Correlators)</option>
                  <option value="Maintenance Team C (Excavation & Repair)">Maintenance Team C (Excavation & Repair)</option>
                  <option value="Zone Night Patrol">Zone Night Patrol</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dispatch Priority
                </label>
                <select
                  value={dispatchPriority}
                  onChange={(e) => setDispatchPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  <option value="Critical">Critical (Immediate Deployment)</option>
                  <option value="High">High (Within 4 Hours)</option>
                  <option value="Medium">Medium (Next Shift)</option>
                  <option value="Low">Low (Scheduled Maintenance)</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Worker Instructions Message
                </label>
                <textarea
                  rows={4}
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  placeholder="Enter specific instructions for the repair team..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingDispatch}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingDispatch ? 'Sending...' : 'SEND REPORT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
