import React from 'react';
import { Activity, Clock, Zap, Settings, RefreshCw, Radio } from 'lucide-react';
import { useTelemetryStream } from '../context/TelemetryStreamContext';

export function ScadaStreamBadge() {
  const {
    status,
    secondsRemaining,
    isTriggering,
    isConnected,
    triggerNow,
    openStreamModal,
  } = useTelemetryStream();

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const cadenceLabel = {
    '5m': '5-Min Interval',
    '1m': '1-Min Interval',
    '15s': '15s Demo Mode',
    'paused': 'Stream Paused',
  }[status?.cadence || '5m'];

  return (
    <div className="flex items-center gap-2">
      {/* Live Stream Pill */}
      <div
        onClick={openStreamModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs"
        title="Click to configure SCADA real-time telemetry streaming"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && status?.active && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected && status?.active
                ? 'bg-emerald-500'
                : isConnected
                ? 'bg-amber-400'
                : 'bg-slate-400'
            }`}
          ></span>
        </span>

        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Radio className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="hidden sm:inline font-bold">SCADA:</span>
          <span className="text-slate-900 font-semibold">{cadenceLabel}</span>
        </div>

        {status?.active && (
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-sky-700">
            <Clock className="w-3 h-3 text-sky-500" />
            <span>{formatCountdown(secondsRemaining)}</span>
          </div>
        )}

        <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 ml-0.5" />
      </div>

      {/* Immediate 5-min Packet Generator Button */}
      <button
        onClick={() => triggerNow()}
        disabled={isTriggering}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-200 rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        title="Simulate immediate arrival of the next 5-minute SCADA sensor packet"
      >
        <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTriggering ? 'animate-bounce' : ''}`} />
        <span className="hidden md:inline">{isTriggering ? 'Ingesting...' : '+5m Telemetry Now'}</span>
        <span className="md:hidden">{isTriggering ? '...' : '+5m'}</span>
      </button>
    </div>
  );
}
