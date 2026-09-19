import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LeakResult } from '../types';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  FileText,
  Filter,
  Flame,
  LayoutGrid,
  List,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export function LeakPrioritiesPage() {
  const navigate = useNavigate();
  const [leaks, setLeaks] = useState<LeakResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const fetchLeaks = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaks();
      setLeaks(res.leaks);
    } catch (err) {
      console.error('Failed to load leaks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaks();
  }, []);

  const filteredLeaks = leaks.filter((l) => {
    if (filterSeverity === 'ALL') return true;
    return l.status === filterSeverity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 rounded-full border border-rose-100 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Operational Triage Queue</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Leak Priority Rankings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Suspected municipal anomalies prioritized by physical loss volume, pressure drop velocity, and confidence index.
          </p>
        </div>

        {/* View toggles & filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-700 font-medium cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Severities ({leaks.length})</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-sm font-semibold text-slate-600">Loading leak priorities queue...</p>
        </div>
      ) : filteredLeaks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No suspected leaks matching criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Either no active anomalies exist in this filter or the network requires a fresh triage analysis run.
          </p>
          <button
            onClick={() => setFilterSeverity('ALL')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeaks.map((leak, idx) => {
            const rank = leak.rank || idx + 1;
            const isCritical = leak.status === 'CRITICAL';
            const isHigh = leak.status === 'HIGH';

            return (
              <div
                key={leak.id}
                onClick={() => navigate(`/leaks/${leak.id}`)}
                className={`p-6 rounded-2xl bg-white border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                  isCritical
                    ? 'border-rose-300 shadow-xs hover:border-rose-400'
                    : isHigh
                    ? 'border-amber-200 shadow-2xs hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Rank & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${
                          isCritical
                            ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                            : isHigh
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        #{rank}
                      </span>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors">
                          Zone {leak.zone}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Detected: {leak.detected_at}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800'
                          : leak.status === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {leak.status}
                    </span>
                  </div>

                  {/* Primary Metrics */}
                  <div className="space-y-3 py-3 border-y border-slate-100 my-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-medium">Estimated Water Loss:</span>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          {leak.estimated_loss.toLocaleString()} L/day
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {(leak.estimated_loss / 1000).toFixed(1)} m³/day
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Leak Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded-full"
                            style={{ width: `${leak.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-sky-700">{leak.confidence}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Prototype Risk Score:</span>
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {leak.priority_score} / 100
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Hydraulic Delta:</span>
                      <span className="font-semibold text-rose-600">
                        -{leak.pressure_anomaly}% Press. / +{leak.flow_anomaly}% Flow
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="pt-2">
                  <Link
                    to={`/leaks/${leak.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-sky-600 hover:text-white border border-slate-200 hover:border-sky-600 rounded-xl transition-all shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Inspect & Generate Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Priority</th>
                  <th className="py-3.5 px-5">Zone</th>
                  <th className="py-3.5 px-5">Estimated Loss</th>
                  <th className="py-3.5 px-5">Confidence</th>
                  <th className="py-3.5 px-5">Risk Score</th>
                  <th className="py-3.5 px-5">Anomaly Delta</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLeaks.map((leak, idx) => {
                  const rank = leak.rank || idx + 1;
                  return (
                    <tr
                      key={leak.id}
                      onClick={() => navigate(`/leaks/${leak.id}`)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-5 font-black text-slate-900">#{rank}</td>
                      <td className="py-4 px-5 font-bold text-slate-900">{leak.zone}</td>
                      <td className="py-4 px-5 font-extrabold text-slate-900">
                        {leak.estimated_loss.toLocaleString()} L/day
                      </td>
                      <td className="py-4 px-5 font-bold text-sky-700">{leak.confidence}%</td>
                      <td className="py-4 px-5 font-medium text-slate-700">{leak.priority_score}/100</td>
                      <td className="py-4 px-5 text-xs text-rose-600 font-semibold">
                        -{leak.pressure_anomaly}% P / +{leak.flow_anomaly}% F
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            leak.status === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : leak.status === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {leak.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/leaks/${leak.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 rounded-lg"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
