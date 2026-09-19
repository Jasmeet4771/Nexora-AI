import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Sliders,
  X,
  Zap,
  Layers,
  Database,
  Info,
} from 'lucide-react';
import { useTelemetryStream } from '../context/TelemetryStreamContext';
import { StreamCadence } from '../types';

export function ScadaStreamModal() {
  const {
    status,
    lastPacket,
    secondsRemaining,
    isTriggering,
    isConnected,
    triggerNow,
    changeCadence,
    closeStreamModal,
    isStreamModalOpen,
  } = useTelemetryStream();

  if (!isStreamModalOpen) return null;

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const cadences: { id: StreamCadence; label: string; desc: string; badge?: string }[] = [
    {
      id: '5m',
      label: '5 Minutes (Standard SCADA)',
      desc: 'Standard municipal sampling cadence for District Metered Areas. Next packet pushes every 300 seconds.',
      badge: 'Production Default',
    },
    {
      id: '15s',
      label: '15 Seconds (Rapid Demo)',
      desc: 'Rapid streaming mode for live demonstrations. Watch charts and leak risk scores update continuously.',
      badge: 'Recommended for Demo',
    },
    {
      id: '1m',
      label: '1 Minute (High Frequency)',
      desc: 'High-resolution telemetry stream for critical zone monitoring during active leak events.',
    },
    {
      id: 'paused',
      label: 'Manual Ingestion Only (Paused)',
      desc: 'Automated periodic telemetry is paused. New readings only ingested on explicit button trigger.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Real-Time SCADA Telemetry Engine</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                  {isConnected ? 'LIVE SSE' : 'CONNECTING'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automated 5-minute telemetry ingestion, time-series progression, and hydraulic model re-calibration.
              </p>
            </div>
          </div>
          <button
            onClick={closeStreamModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Current Status Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Next Telemetry Sync</span>
                <Clock className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {status?.active ? formatCountdown(secondsRemaining) : 'Paused'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {status?.active ? `Cadence: ${status.cadence}` : 'Automatic timer paused'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Packets Generated</span>
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                #{status?.totalPacketsGenerated || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {lastPacket ? `Latest: ${lastPacket.timestamp}` : 'Initial baseline active'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Total DB Records</span>
                <Database className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {lastPacket?.totalRecordsNow || 'Active'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {lastPacket ? `${lastPacket.zonesCount} zones per burst` : 'Historical SQLite storage'}
              </p>
            </div>
          </div>

          {/* Instant Trigger Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Simulate Instant 5-Minute Telemetry Arrival</span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Do not want to wait 5 minutes? Click to immediately inject the next 5-min SCADA sample packet across all zones and re-evaluate leak risks.
              </p>
            </div>

            <button
              onClick={() => triggerNow()}
              disabled={isTriggering}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Ingesting...' : 'Pulse 5-Min Packet'}</span>
            </button>
          </div>

          {/* Stream Cadence Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>Telemetry Ingestion Frequency</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {cadences.map((c) => {
                const isSelected = status?.cadence === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => changeCadence(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-300/40'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{c.label}</span>
                          {c.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Packets Log */}
          {status?.recentPackets && status.recentPackets.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Recent 5-Minute Ingestion Packets
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {status.recentPackets.slice(-4).reverse().map((pkt) => (
                  <div key={pkt.packetId} className="p-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        #{pkt.packetId}
                      </span>
                      <span className="font-mono text-slate-700 font-semibold">{pkt.timestamp}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{pkt.zonesCount} zones updated</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                        {pkt.analysisSummary.suspectedLeaks} suspected leaks
                      </span>
                      <span className="text-slate-500 font-medium">
                        {pkt.analysisSummary.totalEstimatedLoss.toLocaleString()} L/day
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Info Note */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p>
              <strong>SCADA Telemetry Architecture:</strong> Standard municipal DMAs broadcast 5-minute sampling intervals via RTUs/cellular modems. Nexora AI continuously aggregates these packets, recalculates the hydraulic divergence against diurnal baselines, and flags anomalous drop/surge pairs without waiting for manual human queries.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current Server Cadence: <strong className="text-slate-800 font-semibold">{status?.cadence || '5m'}</strong>
          </div>
          <button
            onClick={closeStreamModal}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
