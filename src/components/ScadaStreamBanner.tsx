import React from 'react';
import { Radio, X, ArrowRight, Activity, Zap } from 'lucide-react';
import { useTelemetryStream } from '../context/TelemetryStreamContext';
import { Link } from 'react-router-dom';

export function ScadaStreamBanner() {
  const { latestNotification, dismissNotification, lastPacket, openStreamModal } = useTelemetryStream();

  if (!latestNotification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-md w-full p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-sky-500/30 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0 mt-0.5">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                Live SCADA Sync
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {lastPacket ? lastPacket.timestamp : 'Just now'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 mt-1 leading-relaxed">
              {latestNotification}
            </p>
            {lastPacket && (
              <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                <button
                  onClick={openStreamModal}
                  className="font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Stream Console
                </button>
                <span className="text-slate-600">•</span>
                <Link
                  to="/data"
                  onClick={dismissNotification}
                  className="inline-flex items-center gap-1 font-bold text-slate-300 hover:text-white transition-colors"
                >
                  <span>View Telemetry Table</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={dismissNotification}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
