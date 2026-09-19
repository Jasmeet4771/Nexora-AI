import {
  insertSensorReadings,
  getSensorReadings,
  getZoneList,
  db,
  SensorReading,
  createAnalysisRun,
  insertLeakResults,
} from '../database/db';
import { runNetworkAnalysis } from './anomalyDetection';
import { Response } from 'express';

export type StreamSpeed = '5m' | '1m' | '15s' | 'paused';

interface TelemetryPacket {
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

class SensorStreamService {
  private timer: NodeJS.Timeout | null = null;
  private currentCadence: StreamSpeed = '5m';
  private intervalSeconds: number = 300; // 5 minutes by default
  private nextTickTimestamp: number = Date.now() + 300 * 1000;
  private clients: Set<Response> = new Set();
  private packetCounter: number = 0;
  private isGenerating: boolean = false;
  private recentPackets: TelemetryPacket[] = [];

  constructor() {
    this.startTimer();
  }

  // Set interval cadence
  public setCadence(speed: StreamSpeed) {
    this.currentCadence = speed;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    switch (speed) {
      case '5m':
        this.intervalSeconds = 300;
        break;
      case '1m':
        this.intervalSeconds = 60;
        break;
      case '15s':
        this.intervalSeconds = 15;
        break;
      case 'paused':
        this.intervalSeconds = 0;
        this.broadcastStatus();
        return;
    }

    this.nextTickTimestamp = Date.now() + this.intervalSeconds * 1000;
    this.startTimer();
    this.broadcastStatus();
  }

  private startTimer() {
    if (this.intervalSeconds <= 0) return;
    this.nextTickTimestamp = Date.now() + this.intervalSeconds * 1000;

    this.timer = setInterval(async () => {
      await this.generateAndBroadcastTelemetry();
      this.nextTickTimestamp = Date.now() + this.intervalSeconds * 1000;
    }, this.intervalSeconds * 1000);
  }

  // Subscribe SSE client
  public subscribeClient(res: Response) {
    this.clients.add(res);

    // Send initial handshake and current status
    res.write(`event: connected\ndata: ${JSON.stringify(this.getStatus())}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public getStatus() {
    const secondsRemaining = Math.max(0, Math.round((this.nextTickTimestamp - Date.now()) / 1000));
    return {
      active: this.currentCadence !== 'paused',
      cadence: this.currentCadence,
      intervalSeconds: this.intervalSeconds,
      secondsRemaining: this.currentCadence === 'paused' ? 0 : secondsRemaining,
      connectedClients: this.clients.size,
      totalPacketsGenerated: this.packetCounter,
      recentPackets: this.recentPackets.slice(-5),
    };
  }

  private broadcastStatus() {
    const payload = JSON.stringify(this.getStatus());
    for (const client of this.clients) {
      try {
        client.write(`event: status_update\ndata: ${payload}\n\n`);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Generates the next 5-minute SCADA telemetry readings for all network zones,
   * updates the database, updates the network analysis, and pushes to clients.
   */
  public async generateAndBroadcastTelemetry(): Promise<TelemetryPacket> {
    if (this.isGenerating) {
      // Avoid overlapping writes
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.isGenerating = true;
    try {
      this.packetCounter++;

      // 1. Calculate next 5-minute timestamp
      const latestRow = db.prepare('SELECT timestamp FROM sensor_readings ORDER BY timestamp DESC LIMIT 1').get() as { timestamp?: string } | undefined;
      let nextDate: Date;

      if (latestRow?.timestamp) {
        // Parse existing timestamp
        const parsed = new Date(latestRow.timestamp);
        if (isNaN(parsed.getTime())) {
          nextDate = new Date();
        } else {
          // Advance by 5 minutes
          nextDate = new Date(parsed.getTime() + 5 * 60 * 1000);
        }
      } else {
        nextDate = new Date();
      }

      // Format timestamp YYYY-MM-DD HH:mm:ss
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const hh = String(nextDate.getHours()).padStart(2, '0');
      const min = String(nextDate.getMinutes()).padStart(2, '0');
      const ss = String(nextDate.getSeconds()).padStart(2, '0');
      const formattedTimestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

      // 2. Zone definitions and baseline specs
      const zoneSpecs = [
        {
          zone: 'A04',
          lat: 30.3421,
          lng: 76.8124,
          baseExpP: 50.0,
          baseExpF: 100.0,
          // Mild incipient leak
          isLeak: true,
          pDropPct: 0.12, // ~12% pressure drop
          fSurgePct: 0.13, // ~13% flow surge
        },
        {
          zone: 'B12',
          lat: 30.3542,
          lng: 76.8341,
          baseExpP: 50.0,
          baseExpF: 100.0,
          // Severe critical pipe rupture!
          isLeak: true,
          pDropPct: 0.32, // ~32% pressure drop (drops to ~34 bar)
          fSurgePct: 0.35, // ~35% flow surge (draws ~135 m³/h)
        },
        {
          zone: 'C07',
          lat: 30.3621,
          lng: 76.8521,
          baseExpP: 52.0,
          baseExpF: 95.0,
          // High priority crack
          isLeak: true,
          pDropPct: 0.20, // ~20% pressure drop (drops to ~41 bar)
          fSurgePct: 0.23, // ~23% flow surge
        },
        {
          zone: 'D02',
          lat: 30.3789,
          lng: 76.8291,
          baseExpP: 48.0,
          baseExpF: 80.0,
          isLeak: false,
          pDropPct: 0,
          fSurgePct: 0,
        },
        {
          zone: 'E15',
          lat: 30.3312,
          lng: 76.8642,
          baseExpP: 51.0,
          baseExpF: 90.0,
          isLeak: false,
          pDropPct: 0,
          fSurgePct: 0,
        },
        {
          zone: 'F09',
          lat: 30.3491,
          lng: 76.8791,
          baseExpP: 50.0,
          baseExpF: 85.0,
          isLeak: false,
          pDropPct: 0,
          fSurgePct: 0,
        },
        {
          zone: 'G03',
          lat: 30.3389,
          lng: 76.7991,
          baseExpP: 49.0,
          baseExpF: 75.0,
          isLeak: false,
          pDropPct: 0,
          fSurgePct: 0,
        },
      ];

      // Time-of-day diurnal flow modulation (morning peak at 8am, evening peak at 7pm)
      const hour = nextDate.getHours();
      let diurnalMultiplier = 1.0;
      if (hour >= 6 && hour <= 9) {
        diurnalMultiplier = 1.15; // morning consumption peak
      } else if (hour >= 18 && hour <= 21) {
        diurnalMultiplier = 1.18; // evening consumption peak
      } else if (hour >= 0 && hour <= 5) {
        diurnalMultiplier = 0.78; // low nighttime baseline
      }

      // 3. Generate fresh readings with realistic micro-variations
      const newReadings: SensorReading[] = [];

      for (const spec of zoneSpecs) {
        // Realistic hydraulic jitter
        const pJitter = (Math.random() - 0.5) * 0.4; // ±0.2 bar
        const fJitter = (Math.random() - 0.5) * 1.5; // ±0.75 m³/h

        const expP = Math.round((spec.baseExpP + pJitter * 0.5) * 10) / 10;
        const expF = Math.round((spec.baseExpF * diurnalMultiplier + fJitter * 0.5) * 10) / 10;

        let actualP: number;
        let actualF: number;

        if (spec.isLeak) {
          // Sustained hydraulic anomaly signature
          const pDeficit = expP * spec.pDropPct + (Math.random() - 0.5) * 0.8;
          const fSurge = expF * spec.fSurgePct + (Math.random() - 0.5) * 1.8;
          actualP = Math.round(Math.max(15, expP - pDeficit) * 10) / 10;
          actualF = Math.round((expF + fSurge) * 10) / 10;
        } else {
          // Nominal operating zone
          actualP = Math.round((expP + pJitter) * 10) / 10;
          actualF = Math.round((expF + fJitter) * 10) / 10;
        }

        newReadings.push({
          timestamp: formattedTimestamp,
          zone: spec.zone,
          latitude: spec.lat,
          longitude: spec.lng,
          pressure: actualP,
          flow: actualF,
          expected_pressure: expP,
          expected_flow: expF,
        });
      }

      // 4. Ingest new 5-minute readings into SQLite
      insertSensorReadings(newReadings);

      // 5. Run real-time automatic network anomaly re-analysis
      const allReadings = db.prepare('SELECT * FROM sensor_readings ORDER BY timestamp ASC').all() as unknown as SensorReading[];
      const analysisResult = runNetworkAnalysis(allReadings);

      const runId = createAnalysisRun({
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        readings_analysed: analysisResult.readings_analysed,
        zones_analysed: analysisResult.zones_analysed,
        leaks_detected: analysisResult.leaks_detected,
        total_estimated_loss: analysisResult.total_estimated_loss,
        highest_priority_zone: analysisResult.highest_priority_zone,
      });

      const leaksToInsert = analysisResult.detected_leaks.map((leak) => ({
        ...leak,
        analysis_id: runId,
      }));
      insertLeakResults(leaksToInsert);

      const packet: TelemetryPacket = {
        packetId: this.packetCounter,
        timestamp: formattedTimestamp,
        intervalMinutes: 5,
        readings: newReadings,
        zonesCount: newReadings.length,
        totalRecordsNow: allReadings.length,
        analysisSummary: {
          suspectedLeaks: analysisResult.leaks_detected,
          totalEstimatedLoss: analysisResult.total_estimated_loss,
          highestPriorityZone: analysisResult.highest_priority_zone,
        },
      };

      this.recentPackets.push(packet);
      if (this.recentPackets.length > 20) {
        this.recentPackets.shift();
      }

      // 6. Broadcast event to all SSE clients
      const eventPayload = JSON.stringify({
        packet,
        status: this.getStatus(),
      });

      for (const client of this.clients) {
        try {
          client.write(`event: telemetry_tick\ndata: ${eventPayload}\n\n`);
        } catch {
          this.clients.delete(client);
        }
      }

      return packet;
    } finally {
      this.isGenerating = false;
    }
  }
}

export const sensorStreamService = new SensorStreamService();
