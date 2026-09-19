import {
  SensorReading,
  AnalysisRun,
  LeakResult,
  AiInvestigationReport,
  WorkerDispatchRecord,
  NetworkData,
  TelemetryPacket,
  StreamStatus,
  StreamCadence,
} from '../types';

export const api = {
  // Sensor Data
  async getReadings(params?: { limit?: number; offset?: number; zone?: string; search?: string }): Promise<{
    total: number;
    limit: number;
    offset: number;
    readings: SensorReading[];
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.zone) query.set('zone', params.zone);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/data?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch readings');
    return res.json();
  },

  async getZones(): Promise<{ zones: { zone: string; count: number; latitude: number; longitude: number }[] }> {
    const res = await fetch('/api/zones');
    if (!res.ok) throw new Error('Failed to fetch zones');
    return res.json();
  },

  async importSampleCsv(): Promise<{
    success: boolean;
    message: string;
    filename: string;
    recordsImported: number;
    zonesCount: number;
    zones: string[];
  }> {
    const res = await fetch('/api/data/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overwrite: true }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import sample CSV');
    }
    return res.json();
  },

  async uploadCsv(file: File, overwrite = true): Promise<{
    success: boolean;
    filename: string;
    message: string;
    recordsImported: number;
    zonesCount: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwrite', String(overwrite));

    const res = await fetch('/api/data/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload CSV');
    }
    return res.json();
  },

  // Analysis
  async runAnalysis(): Promise<{
    success: boolean;
    message: string;
    analysisId: number;
    run: AnalysisRun;
    leaks: LeakResult[];
    summary: {
      totalZones: number;
      zonesAnalysed: number;
      suspectedLeaks: number;
      estimatedWaterLossDay: number;
      highestPriorityLeak: string | null;
    };
  }> {
    const res = await fetch('/api/analysis/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to run analysis');
    }
    return res.json();
  },

  async getLatestAnalysis(): Promise<{
    hasRun: boolean;
    totalZones: number;
    totalReadings: number;
    run: AnalysisRun | null;
    leaks: LeakResult[];
    kpis: {
      totalZones: number;
      zonesAnalysed: number;
      suspectedLeaks: number;
      estimatedWaterLossDay: number;
      highestPriorityLeak: string | null;
    };
  }> {
    const res = await fetch('/api/analysis/latest');
    if (!res.ok) throw new Error('Failed to fetch latest analysis');
    return res.json();
  },

  async getAnalysisHistory(): Promise<{ history: AnalysisRun[] }> {
    const res = await fetch('/api/analysis/history');
    if (!res.ok) throw new Error('Failed to fetch analysis history');
    return res.json();
  },

  // Leaks
  async getLeaks(): Promise<{ analysis_id: number | null; leaks: LeakResult[] }> {
    const res = await fetch('/api/leaks');
    if (!res.ok) throw new Error('Failed to fetch leaks');
    return res.json();
  },

  async getLeakById(id: number): Promise<{
    leak: LeakResult & {
      readings: SensorReading[];
      ai_report?: AiInvestigationReport | null;
      dispatch?: WorkerDispatchRecord | null;
    };
  }> {
    const res = await fetch(`/api/leaks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch leak details');
    return res.json();
  },

  async generateAiReport(id: number): Promise<{
    success: boolean;
    reportId: number;
    report: AiInvestigationReport;
  }> {
    const res = await fetch(`/api/leaks/${id}/ai-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate AI report');
    }
    return res.json();
  },

  getPdfDownloadUrl(leakId: number): string {
    return `/api/leaks/${leakId}/pdf`;
  },

  // Network Map
  async getNetworkData(): Promise<NetworkData> {
    const res = await fetch('/api/network');
    if (!res.ok) throw new Error('Failed to fetch network map data');
    return res.json();
  },

  // Dispatches
  async createDispatch(payload: {
    leak_id: number;
    report_id?: number | null;
    worker_team: string;
    priority: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
    dispatch: WorkerDispatchRecord;
    zone: string;
  }> {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch report');
    }
    return res.json();
  },

  async getDispatches(): Promise<{ dispatches: WorkerDispatchRecord[] }> {
    const res = await fetch('/api/dispatch');
    if (!res.ok) throw new Error('Failed to fetch dispatches');
    return res.json();
  },

  // Real-Time Sensor Telemetry Stream
  async getStreamStatus(): Promise<{ status: StreamStatus }> {
    const res = await fetch('/api/stream/status');
    if (!res.ok) throw new Error('Failed to fetch telemetry stream status');
    return res.json();
  },

  async triggerTelemetryPacket(): Promise<{
    success: boolean;
    message: string;
    packet: TelemetryPacket;
    status: StreamStatus;
  }> {
    const res = await fetch('/api/stream/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to trigger telemetry packet');
    }
    return res.json();
  },

  async setStreamCadence(cadence: StreamCadence): Promise<{
    success: boolean;
    message: string;
    status: StreamStatus;
  }> {
    const res = await fetch('/api/stream/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cadence }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to set stream cadence');
    }
    return res.json();
  },
};
