import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Droplets,
  Layers,
  MapPin,
  RefreshCw,
  TrendingDown,
  Waves,
  Radio,
  Clock,
  Zap,
  Sliders,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisRun, LeakResult } from '../types';
import { useTelemetryStream } from '../context/TelemetryStreamContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    status,
    lastPacket,
    secondsRemaining,
    isTriggering,
    isConnected,
    triggerNow,
    openStreamModal,
  } = useTelemetryStream();

  const [loading, setLoading] = useState<boolean>(true);
  const [analysing, setAnalysing] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [analysisRun, setAnalysisRun] = useState<AnalysisRun | null>(null);
  const [leaks, setLeaks] = useState<LeakResult[]>([]);
  const [totalZones, setTotalZones] = useState<number>(0);
  const [totalReadings, setTotalReadings] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getLatestAnalysis();
      setAnalysisRun(res.run);
      setLeaks(res.leaks);
      setTotalZones(res.totalZones);
      setTotalReadings(res.totalReadings);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time automatic sync when new 5-minute telemetry packet arrives
  useEffect(() => {
    const handleTelemetryPacket = () => {
      fetchDashboardData();
    };

    window.addEventListener('scada-telemetry-packet', handleTelemetryPacket);
    return () => {
      window.removeEventListener('scada-telemetry-packet', handleTelemetryPacket);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalysing(true);
      const res = await api.runAnalysis();
      setAnalysisRun(res.run);
      setLeaks(res.leaks);
      setTotalZones(res.summary.totalZones);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to execute analysis.', 'error');
    } finally {
      setAnalysing(false);
    }
  };

  const handleImportSampleData = async () => {
    try {
      setImporting(true);
      const res = await api.importSampleCsv();
      showToast(`Sample CSV imported: ${res.recordsImported} readings loaded across ${res.zonesCount} zones.`, 'info');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to import sample CSV', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            toastType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastType === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                toastType === 'success'
                  ? 'text-emerald-600'
                  : toastType === 'error'
                  ? 'text-rose-600'
                  : 'text-sky-600'
              }`}
            />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Main Action Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 rounded-full border border-sky-100 mb-2">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>Municipal Water Intelligence Platform</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Network Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time hydraulic telemetry triage, water loss quantification, and AI-assisted field recommendations.
          </p>
        </div>

        {/* Core Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImportSampleData}
            disabled={importing || analysing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Import demo SCADA telemetry CSV"
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>{importing ? 'Importing...' : 'Import Sample CSV'}</span>
          </button>

          <button
            id="analyse-network-btn"
            onClick={handleRunAnalysis}
            disabled={analysing}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${analysing ? 'animate-spin' : ''}`} />
            <span>{analysing ? 'Analysing network...' : 'ANALYSE NETWORK'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time SCADA Telemetry Stream Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-md border border-sky-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Municipal SCADA Telemetry Stream</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                {status?.active ? '5-Min Polling Active' : 'Manual'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Sensors stream readings every 5 minutes. Real-time hydraulic deltas update existing records & quantify ongoing water loss.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {status?.active && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-300">Next packet:</span>
              <span className="font-bold text-white">
                {String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:
                {String(secondsRemaining % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          <button
            onClick={() => triggerNow()}
            disabled={isTriggering}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Simulate immediate arrival of the next 5-minute SCADA packet"
          >
            <Zap className={`w-3.5 h-3.5 ${isTriggering ? 'animate-bounce' : ''}`} />
            <span>{isTriggering ? 'Ingesting...' : '+5m Telemetry Now'}</span>
          </button>

          <button
            onClick={openStreamModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Network Zones */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Zones</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {totalZones > 0 ? totalZones : '7'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            District Metered Areas
          </p>
        </div>

        {/* KPI 2: Zones Analysed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Zones Analysed</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {analysisRun ? analysisRun.zones_analysed : totalZones > 0 ? totalZones : '0'}
          </div>
          <p className="text-xs text-sky-600 mt-1 font-medium">
            {totalReadings > 0 ? `${totalReadings} telemetry readings` : 'Ready for scan'}
          </p>
        </div>

        {/* KPI 3: Suspected Leaks */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Suspected Leaks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-600">
            {analysisRun ? analysisRun.leaks_detected : leaks.length}
          </div>
          <p className="text-xs text-rose-600 mt-1 font-medium">
            Hydraulic divergence detected
          </p>
        </div>

        {/* KPI 4: Estimated Water Loss / Day */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Est. Water Loss</span>
            <TrendingDown className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {analysisRun
              ? `${analysisRun.total_estimated_loss.toLocaleString()} L`
              : leaks.length > 0
              ? `${leaks.reduce((sum, l) => sum + l.estimated_loss, 0).toLocaleString()} L`
              : '0 L'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Per 24-hour cycle
          </p>
        </div>

        {/* KPI 5: Highest Priority Leak */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Highest Priority</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-700">
            {analysisRun?.highest_priority_zone || (leaks[0] ? leaks[0].zone : 'None')}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {leaks[0] ? `#1 ${leaks[0].status} Priority` : 'All zones nominal'}
          </p>
        </div>
      </div>

      {/* Priority Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Leak Priority Queue</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                {leaks.length} Anomaly Zones Flagged
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by composite Prototype Leak Risk Score (magnitude of estimated water loss + hydraulic pressure deficit).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>View On Network Map</span>
            </Link>
          </div>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Zone</th>
                <th className="py-3.5 px-5">Estimated Loss</th>
                <th className="py-3.5 px-5">Confidence</th>
                <th className="py-3.5 px-5">Pressure / Flow Delta</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leaks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Waves className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-base font-semibold text-slate-600">No active leaks detected</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "ANALYSE NETWORK" above or import sample telemetry to initiate the hydraulic triage scan.
                    </p>
                  </td>
                </tr>
              ) : (
                leaks.map((leak, idx) => {
                  const rank = leak.rank || idx + 1;
                  return (
                    <tr
                      key={leak.id || leak.zone}
                      onClick={() => navigate(`/leaks/${leak.id}`)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Priority */}
                      <td className="py-4 px-5 font-extrabold text-slate-900">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-black">
                          #{rank}
                        </span>
                      </td>

                      {/* Zone */}
                      <td className="py-4 px-5 font-bold text-slate-900 text-base">
                        {leak.zone}
                      </td>

                      {/* Estimated Loss */}
                      <td className="py-4 px-5 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span>{leak.estimated_loss.toLocaleString()} L/day</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {(leak.estimated_loss / 1000).toFixed(1)} m³/day
                          </span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-sky-600 rounded-full"
                              style={{ width: `${leak.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-sky-700">
                            {leak.confidence}%
                          </span>
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-4 px-5 text-xs text-slate-600">
                        <span className="font-semibold text-rose-600">-{leak.pressure_anomaly}% P</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="font-semibold text-rose-600">+{leak.flow_anomaly}% F</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${
                            leak.status === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : leak.status === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : leak.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {leak.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/leaks/${leak.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 group-hover:text-white group-hover:bg-sky-600 rounded-lg transition-all"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
