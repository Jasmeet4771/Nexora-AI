import { useEffect, useState } from 'react';
import { NetworkMapLeaflet } from '../components/NetworkMapLeaflet';
import { api } from '../services/api';
import { NetworkData } from '../types';
import { AlertTriangle, Droplets, MapPin, RefreshCw, ShieldAlert, Waves } from 'lucide-react';

export function NetworkMapPage() {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const fetchNetwork = async () => {
    try {
      setLoading(true);
      const data = await api.getNetworkData();
      setNetworkData(data);
    } catch (err) {
      console.error('Failed to load network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  // Real-time automatic sync when new 5-minute SCADA packet arrives
  useEffect(() => {
    const handleTelemetryPacket = () => {
      fetchNetwork();
    };

    window.addEventListener('scada-telemetry-packet', handleTelemetryPacket);
    return () => {
      window.removeEventListener('scada-telemetry-packet', handleTelemetryPacket);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 rounded-full border border-sky-100 mb-2">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>GIS Municipal Grid Overlays</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Network Distribution Map
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Simulated spatial view of municipal pipeline corridors, pressure reducing valves (PRVs), and suspected leak clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNetwork}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Spatial Grid</span>
          </button>
        </div>
      </div>

      {/* Network Stats Bar */}
      {networkData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Monitored DMA Zones</div>
              <div className="text-xl font-bold text-slate-900">{networkData.nodes.length} Nodes Active</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Suspected Rupture Hotspots</div>
              <div className="text-xl font-bold text-rose-700">{networkData.stats.suspectedLeaks} Zones Flagged</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Critical Priority Node</div>
              <div className="text-xl font-bold text-slate-900">
                {networkData.stats.highestPriorityZone ? `Zone ${networkData.stats.highestPriorityZone}` : 'None'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Zone Navigator Buttons */}
      {networkData && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">Quick Pan:</span>
          {networkData.nodes.map((node) => (
            <button
              key={node.zone}
              onClick={() => setSelectedZone(node.zone)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer shrink-0 ${
                selectedZone === node.zone
                  ? 'bg-sky-600 text-white border-sky-600'
                  : node.hasLeak
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Zone {node.zone} {node.hasLeak ? `(Leak #${node.priority})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Leaflet Map Card */}
      {loading && !networkData ? (
        <div className="w-full h-[600px] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
            <p className="text-sm font-semibold text-slate-600">Loading spatial GIS distribution grid...</p>
          </div>
        </div>
      ) : networkData ? (
        <NetworkMapLeaflet
          nodes={networkData.nodes}
          pipelines={networkData.pipelines}
          selectedZone={selectedZone}
          onSelectZone={(zone) => setSelectedZone(zone)}
        />
      ) : null}
    </div>
  );
}
