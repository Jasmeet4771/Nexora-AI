import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AnalysisRun } from '../types';
import { History, RefreshCw, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export function AnalysisHistoryPage() {
  const [history, setHistory] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalysisHistory();
      setHistory(res.history);
    } catch (err) {
      console.error('Failed to load analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 rounded-full border border-sky-100 mb-2">
            <History className="w-3.5 h-3.5 text-sky-600" />
            <span>Audit Trail & Telemetry Scans</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analysis Run History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Historical log of all automated hydraulic scans, readings parsed, and leak loss totals.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Run ID</th>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Readings Analysed</th>
                <th className="py-3.5 px-5">Zones Analysed</th>
                <th className="py-3.5 px-5">Leaks Detected</th>
                <th className="py-3.5 px-5">Total Est. Loss</th>
                <th className="py-3.5 px-5">Highest Priority</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>Loading analysis log...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No historical analysis runs on record. Run your first analysis from the Dashboard.
                  </td>
                </tr>
              ) : (
                history.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      #{String(run.id).padStart(3, '0')}
                    </td>
                    <td className="py-4 px-5 text-slate-600 text-xs">
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-700">
                      {run.readings_analysed.toLocaleString()} records
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-700">
                      {run.zones_analysed} zones
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        {run.leaks_detected} leaks
                      </span>
                    </td>
                    <td className="py-4 px-5 font-extrabold text-slate-900">
                      {run.total_estimated_loss.toLocaleString()} L/day
                    </td>
                    <td className="py-4 px-5 font-black text-rose-700">
                      Zone {run.highest_priority_zone || 'None'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <span>View Queue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
