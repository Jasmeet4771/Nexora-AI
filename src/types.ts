export interface SensorReading {
  id: number;
  timestamp: string;
  zone: string;
  latitude: number;
  longitude: number;
  pressure: number;
  flow: number;
  expected_pressure: number;
  expected_flow: number;
}

export interface AnalysisRun {
  id: number;
  started_at: string;
  completed_at: string;
  readings_analysed: number;
  zones_analysed: number;
  leaks_detected: number;
  total_estimated_loss: number;
  highest_priority_zone: string | null;
}

export interface LeakResult {
  id: number;
  analysis_id: number;
  zone: string;
  pressure_anomaly: number;
  flow_anomaly: number;
  estimated_loss: number;
  confidence: number;
  priority_score: number;
  status: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'Dispatched' | string;
  detected_at: string;
  latitude?: number;
  longitude?: number;
  expected_pressure?: number;
  actual_pressure?: number;
  expected_flow?: number;
  actual_flow?: number;
  rank?: number;
}

export interface AiInvestigationReport {
  id?: number;
  leak_id?: number;
  created_at?: string;
  title: string;
  anomaly_summary: string;
  why_suspicious: string;
  estimated_impact: string;
  priority_explanation: string;
  recommended_inspection_action: string;
  suggested_pipeline_segment: string;
  worker_instructions: string;
  disclaimer?: string;
}

export interface WorkerDispatchRecord {
  id: number;
  report_code: string;
  leak_id: number;
  report_id?: number | null;
  worker_team: string;
  priority: string;
  message: string;
  dispatched_at: string;
  status: string;
  zone?: string;
  estimated_loss?: number;
  confidence?: number;
}

export interface NetworkNode {
  id: number | null;
  zone: string;
  latitude: number;
  longitude: number;
  status: 'Normal' | 'Warning' | 'Suspected Leak' | 'Highest Priority';
  leakStatus: string;
  markerColor: 'GREEN' | 'YELLOW' | 'RED' | 'DARK RED';
  estimated_loss: number;
  confidence: number;
  priority: string;
  priority_score: number;
  hasLeak: boolean;
}

export interface PipelineConnection {
  from: string;
  to: string;
  name: string;
}

export interface NetworkData {
  label: string;
  notice: string;
  nodes: NetworkNode[];
  pipelines: PipelineConnection[];
  stats: {
    totalZones: number;
    suspectedLeaks: number;
    highestPriorityZone: string | null;
  };
}

export type StreamCadence = '5m' | '1m' | '15s' | 'paused';

export interface TelemetryPacket {
  packetId: number;
  timestamp: string;
  intervalMinutes: number;
  readings: SensorReading[];
  zonesCount: number;
  totalRecordsNow: number;
  analysisSummary: {
    suspectedLeaks: number;
    totalEstimatedLoss: number;
    highestPriorityZone: string | null;
  };
}

export interface StreamStatus {
  active: boolean;
  cadence: StreamCadence;
  intervalSeconds: number;
  secondsRemaining: number;
  connectedClients: number;
  totalPacketsGenerated: number;
  recentPackets: TelemetryPacket[];
}
