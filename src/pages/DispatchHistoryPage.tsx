import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { WorkerDispatchRecord } from '../types';
import { Send, RefreshCw, Download, ExternalLink, CheckCircle2, UserCheck, Eye, X } from 'lucide-react';

export function DispatchHistoryPage() {
  const [dispatches, setDispatches] = useState<WorkerDispatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDispatch, setSelectedDispatch] = useState<WorkerDispatchRecord | null>(null);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const res = await api.getDispatches();
      setDispatches(res.dispatches);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full border border-blue-100 mb-2">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Field Maintenance Coordination</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dispatch History & Tracking
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time status tracking of inspection and repair dossiers dispatched to municipal field crews.
          </p>
        </div>

        <button
          onClick={fetchDispatches}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Dispatches</span>
        </button>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Report ID</th>
                <th className="py-3.5 px-5">Zone</th>
                <th className="py-3.5 px-5">Assigned Team</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Dispatched At</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>Loading dispatch history...</span>
                  </td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No work orders dispatched yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Generate an AI report from a leak details page and click "SEND TO WORKERS" to dispatch.
                    </p>
                  </td>
                </tr>
              ) : (
                dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-mono font-black text-sky-700">
                      {d.report_code}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 text-base">
                      Zone {d.zone || 'N/A'}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {d.worker_team}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                          d.priority.toLowerCase().includes('critical')
                            ? 'bg-rose-100 text-rose-800'
                            : d.priority.toLowerCase().includes('high')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-600">
                      {new Date(d.dispatched_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDispatch(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="View dispatch message"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <a
                        href={api.getPdfDownloadUrl(d.leak_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                        title="Download official PDF report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>

                      <Link
                        to={`/leaks/${d.leak_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Detail Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Work Order: {selectedDispatch.report_code}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Zone {selectedDispatch.zone} Field Instructions
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Assigned Crew:</span>
                  <span className="font-bold text-slate-800">{selectedDispatch.worker_team}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Priority Level:</span>
                  <span className="font-bold text-rose-700">{selectedDispatch.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Dispatched Timestamp:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedDispatch.dispatched_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Current Status:</span>
                  <span className="font-bold text-emerald-700">{selectedDispatch.status}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Transmitted Field Crew Instructions:
                </span>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-medium text-emerald-950 leading-relaxed">
                  {selectedDispatch.message}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={api.getPdfDownloadUrl(selectedDispatch.leak_id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Attached PDF</span>
              </a>

              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
