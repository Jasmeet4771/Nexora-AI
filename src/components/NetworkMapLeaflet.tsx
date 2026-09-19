import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { NetworkNode, PipelineConnection } from '../types';
import { AlertCircle, ExternalLink, Filter, ShieldCheck, Waves } from 'lucide-react';

interface NetworkMapLeafletProps {
  nodes: NetworkNode[];
  pipelines: PipelineConnection[];
  selectedZone?: string | null;
  onSelectZone?: (zone: string) => void;
}

// Custom icon creator using Leaflet divIcon
function createMarkerIcon(node: NetworkNode) {
  let bgColor = '#16a34a'; // Green
  let ringColor = 'rgba(22, 163, 74, 0.2)';
  let isHighest = node.status === 'Highest Priority' || node.markerColor === 'DARK RED';

  if (isHighest) {
    bgColor = '#7f1d1d'; // Dark Red
    ringColor = 'rgba(185, 28, 28, 0.4)';
  } else if (node.status === 'Suspected Leak' || node.markerColor === 'RED') {
    bgColor = '#dc2626'; // Red
    ringColor = 'rgba(220, 38, 38, 0.3)';
  } else if (node.status === 'Warning' || node.markerColor === 'YELLOW') {
    bgColor = '#d97706'; // Amber / Yellow
    ringColor = 'rgba(217, 119, 6, 0.25)';
  }

  const pulseHtml = isHighest
    ? `<div style="position:absolute; width:44px; height:44px; top:-10px; left:-10px; border-radius:50%; background:${ringColor}; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
    : '';

  const html = `
    <div style="position:relative; width:24px; height:24px;">
      ${pulseHtml}
      <div style="
        width: 24px;
        height: 24px;
        background: ${bgColor};
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 10px;
        letter-spacing: -0.5px;
      ">
        ${node.zone}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

// Helper to center on selected zone
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function NetworkMapLeaflet({
  nodes,
  pipelines,
  selectedZone,
  onSelectZone,
}: NetworkMapLeafletProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [onlySuspected, setOnlySuspected] = useState<boolean>(false);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (onlySuspected && !node.hasLeak) return false;
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'CRITICAL' && (node.status === 'Highest Priority' || node.leakStatus === 'CRITICAL')) return true;
      if (filterStatus === 'HIGH' && (node.status === 'Suspected Leak' || node.leakStatus === 'HIGH')) return true;
      if (filterStatus === 'WARNING' && node.status === 'Warning') return true;
      if (filterStatus === 'NORMAL' && node.status === 'Normal') return true;
      return true;
    });
  }, [nodes, filterStatus, onlySuspected]);

  // Center coordinate
  const mapCenter: [number, number] = useMemo(() => {
    if (selectedZone) {
      const target = nodes.find((n) => n.zone === selectedZone);
      if (target) return [target.latitude, target.longitude];
    }
    return [30.352, 76.832]; // Default center
  }, [selectedZone, nodes]);

  // Polyline coordinates for pipelines
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.zone, n])), [nodes]);

  const pipelineSegments = useMemo(() => {
    return pipelines
      .map((p) => {
        const fromNode = nodeMap.get(p.from);
        const toNode = nodeMap.get(p.to);
        if (fromNode && toNode) {
          const hasAnomaly = fromNode.hasLeak || toNode.hasLeak;
          return {
            ...p,
            coords: [
              [fromNode.latitude, fromNode.longitude],
              [toNode.latitude, toNode.longitude],
            ] as [number, number][],
            color: hasAnomaly ? '#ea580c' : '#0284c7', // Orange/Amber if anomaly adjacent, blue if normal
            weight: hasAnomaly ? 3.5 : 2.5,
            dashArray: hasAnomaly ? '6, 6' : undefined,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [pipelines, nodeMap]);

  return (
    <div className="relative w-full h-[600px] md:h-[680px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col">
      {/* Top Banner Notice */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded">
            Demo Network
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Simulated municipal water distribution grid for prototype demonstration. Coordinates do not represent real physical pipelines.
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlySuspected}
              onChange={(e) => setOnlySuspected(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
            />
            <span>Show only suspected leaks</span>
          </label>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Zones ({nodes.length})</option>
              <option value="CRITICAL">Critical Leaks</option>
              <option value="HIGH">High Priority</option>
              <option value="WARNING">Warning</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <MapCenterController center={mapCenter} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pipeline Polylines */}
          {pipelineSegments.map((segment, idx) =>
            segment ? (
              <Polyline
                key={idx}
                positions={segment.coords}
                pathOptions={{
                  color: segment.color,
                  weight: segment.weight,
                  dashArray: segment.dashArray,
                  opacity: 0.85,
                }}
              />
            ) : null
          )}

          {/* Zone Nodes */}
          {filteredNodes.map((node) => (
            <Marker
              key={node.zone}
              position={[node.latitude, node.longitude]}
              icon={createMarkerIcon(node)}
              eventHandlers={{
                click: () => onSelectZone?.(node.zone),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px] text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                    <span className="font-extrabold text-sm text-slate-900">Zone: {node.zone}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        node.status === 'Highest Priority'
                          ? 'bg-rose-100 text-rose-800'
                          : node.status === 'Suspected Leak'
                          ? 'bg-red-100 text-red-700'
                          : node.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-semibold text-slate-800">{node.leakStatus || node.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated loss:</span>
                      <span className="font-bold text-slate-900">
                        {node.estimated_loss > 0 ? `${node.estimated_loss.toLocaleString()} L/day` : 'Nominal'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Confidence:</span>
                      <span className="font-semibold text-sky-700">
                        {node.confidence > 0 ? `${node.confidence}%` : 'Normal'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Priority:</span>
                      <span className="font-bold text-rose-600">{node.priority}</span>
                    </div>
                  </div>

                  {node.id && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <Link
                        to={`/leaks/${node.id}`}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                      >
                        <span>Investigate Leak</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-2 max-w-[210px]">
          <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-sky-600" />
            <span>Map Legend</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#7f1d1d] ring-2 ring-red-400"></span>
              <span className="font-medium">DARK RED = Highest Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#dc2626]"></span>
              <span>RED = Suspected Leak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#d97706]"></span>
              <span>YELLOW = Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#16a34a]"></span>
              <span>GREEN = Normal</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
              <span className="inline-block w-3 h-0.5 bg-sky-600 mr-1.5 align-middle"></span>
              <span>Main Distribution Pipeline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
