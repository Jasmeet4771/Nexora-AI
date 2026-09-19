import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { SensorReading } from '../types';
import { useTelemetryStream } from '../context/TelemetryStreamContext';
import {
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Radio,
  Clock,
  Zap,
  Sliders,
} from 'lucide-react';

export function SensorDataPage() {
  const {
    status,
    lastPacket,
    secondsRemaining,
    isTriggering,
    isConnected,
    triggerNow,
    openStreamModal,
  } = useTelemetryStream();

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 25;

  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [readingsRes, zonesRes] = await Promise.all([
        api.getReadings({
          limit,
          offset: (page - 1) * limit,
          zone: selectedZone === 'ALL' ? undefined : selectedZone,
          search: searchQuery.trim() || undefined,
        }),
        api.getZones(),
      ]);

      setReadings(readingsRes.readings);
      setTotalCount(readingsRes.total);
      setZones(zonesRes.zones.map((z) => z.zone));
    } catch (err: any) {
      console.error('Failed to load sensor readings:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, selectedZone, searchQuery]);

  // Listen to live real-time SCADA telemetry packets
  useEffect(() => {
    const handleTelemetryPacket = () => {
      // Reload silently so user doesn't experience disruption
      loadData(true);
    };

    window.addEventListener('scada-telemetry-packet', handleTelemetryPacket);
    return () => {
      window.removeEventListener('scada-telemetry-packet', handleTelemetryPacket);
    };
  }, [page, selectedZone, searchQuery]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setFeedback({ message: 'Please upload a valid .csv file.', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadCsv(file, true);
      setFeedback({
        message: `Uploaded "${res.filename}": Imported ${res.recordsImported} readings across ${res.zonesCount} zones.`,
        type: 'success',
      });
      setPage(1);
      await loadData();
    } catch (err: any) {
      setFeedback({
        message: err.message || 'CSV upload failed. Please check column format.',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImportSample = async () => {
    try {
      setImporting(true);
      const res = await api.importSampleCsv();
      setFeedback({
        message: `Sample CSV loaded: ${res.recordsImported} readings imported across ${res.zonesCount} zones.`,
        type: 'success',
      });
      setPage(1);
      await loadData();
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to import sample CSV',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 rounded-full border border-sky-100 mb-2">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>SCADA & Telemetry Ingestion</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sensor Telemetry Data
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Import pressure and flow time-series records from municipal SCADA loggers or CSV files.
          </p>
        </div>

        <button
          onClick={handleImportSample}
          disabled={importing || uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
          <span>{importing ? 'Importing Sample CSV...' : 'Import Sample CSV'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
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

      {/* SCADA Telemetry Real-Time Stream Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-md border border-sky-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Automated SCADA Telemetry Ingestion</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                {status?.active ? '5-Min Interval Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live municipal data stream simulates SCADA logger packets arriving every 5 minutes. As new readings arrive, previous hydraulic records and leak probability indices update dynamically.
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
            title="Force immediate arrival of the next 5-minute SCADA packet"
          >
            <Zap className={`w-3.5 h-3.5 ${isTriggering ? 'animate-bounce' : ''}`} />
            <span>{isTriggering ? 'Ingesting...' : '+5m Telemetry Now'}</span>
          </button>

          <button
            onClick={openStreamModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stream Cadence</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
          dragOver
            ? 'border-sky-500 bg-sky-50/80 scale-[1.005]'
            : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="p-3 rounded-full bg-sky-50 text-sky-600 shadow-2xs">
            <Upload className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {uploading ? 'Processing & Ingesting Telemetry...' : 'Drop your municipal sensor CSV here'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports SCADA CSV headers: timestamp, zone, latitude, longitude, pressure, flow, expected_pressure, expected_flow
            </p>
          </div>
          <button
            type="button"
            className="mt-1 px-4 py-1.5 text-xs font-semibold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors cursor-pointer"
          >
            Browse Local File
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search timestamp, zone..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-52"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Zones ({zones.length})</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{readings.length}</strong> of <strong>{totalCount}</strong> records
        </div>
      </div>

      {/* Sensor Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Pressure</th>
                <th className="py-3 px-4">Exp. Pressure</th>
                <th className="py-3 px-4">Flow</th>
                <th className="py-3 px-4">Exp. Flow</th>
                <th className="py-3 px-4">Hydraulic Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>Loading telemetry records...</span>
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sensor readings found. Upload a CSV or click "Import Sample CSV".
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const pDrop = (((r.expected_pressure - r.pressure) / r.expected_pressure) * 100).toFixed(1);
                  const fSurge = (((r.flow - r.expected_flow) / r.expected_flow) * 100).toFixed(1);
                  const isAnomalous = Number(pDrop) > 8 || Number(fSurge) > 8;
                  const isNewestPacket = lastPacket?.timestamp === r.timestamp;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNewestPacket
                          ? 'bg-emerald-50/40'
                          : isAnomalous
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{r.timestamp}</span>
                          {isNewestPacket && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                              LIVE 5m
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.zone}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.pressure.toFixed(1)} bar</td>
                      <td className="py-3 px-4 text-slate-500">{r.expected_pressure.toFixed(1)} bar</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.flow.toFixed(1)} m³/h</td>
                      <td className="py-3 px-4 text-slate-500">{r.expected_flow.toFixed(1)} m³/h</td>
                      <td className="py-3 px-4">
                        {isAnomalous ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <span>-{pDrop}% P / +{fSurge}% F</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Nominal</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
