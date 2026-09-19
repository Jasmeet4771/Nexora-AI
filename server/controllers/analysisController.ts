import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  getSensorReadings,
  getSensorReadingsCount,
  getZoneList,
  createAnalysisRun,
  insertLeakResults,
  getLatestAnalysis,
  getAnalysisHistory,
  insertSensorReadings,
} from '../database/db';
import { runNetworkAnalysis } from '../services/anomalyDetection';
import { parseCsvContent } from './dataController';

export async function runAnalysis(req: Request, res: Response) {
  try {
    const startedAt = new Date().toISOString();

    // Check if readings exist; if 0, auto-import sample data for smooth hackathon demo
    let count = getSensorReadingsCount();
    if (count === 0) {
      const samplePath = path.join(process.cwd(), 'server', 'sample-data', 'sample_network_data.csv');
      if (fs.existsSync(samplePath)) {
        const csvText = fs.readFileSync(samplePath, 'utf-8');
        const parsed = parseCsvContent(csvText);
        if (parsed.valid) {
          insertSensorReadings(parsed.readings);
        }
      }
    }

    // Fetch all readings
    const allReadings = getSensorReadings(5000, 0);
    if (allReadings.length === 0) {
      return res.status(400).json({
        error: 'No sensor telemetry data found. Please import or upload a CSV first.',
      });
    }

    // Run the prototype anomaly detection & scoring engine
    const analysis = runNetworkAnalysis(allReadings);
    const completedAt = new Date().toISOString();

    // Store in analysis_runs
    const analysisId = createAnalysisRun({
      started_at: startedAt,
      completed_at: completedAt,
      readings_analysed: analysis.readings_analysed,
      zones_analysed: analysis.zones_analysed,
      leaks_detected: analysis.leaks_detected,
      total_estimated_loss: analysis.total_estimated_loss,
      highest_priority_zone: analysis.highest_priority_zone,
    });

    // Store in leak_results
    const leaksToInsert = analysis.detected_leaks.map((l) => ({
      ...l,
      analysis_id: analysisId,
    }));
    insertLeakResults(leaksToInsert);

    // Fetch fresh ranked results
    const latest = getLatestAnalysis();

    return res.json({
      success: true,
      message: `Analysis complete — ${analysis.leaks_detected} potential leaks detected.`,
      analysisId,
      run: latest.run,
      leaks: latest.leaks,
      summary: {
        totalZones: getZoneList().length,
        zonesAnalysed: analysis.zones_analysed,
        suspectedLeaks: analysis.leaks_detected,
        estimatedWaterLossDay: analysis.total_estimated_loss,
        highestPriorityLeak: analysis.highest_priority_zone,
      },
    });
  } catch (error: any) {
    console.error('Run analysis error:', error);
    return res.status(500).json({ error: error.message || 'Error executing network analysis.' });
  }
}

export async function getLatest(req: Request, res: Response) {
  try {
    const latest = getLatestAnalysis();
    const zones = getZoneList();
    const totalReadings = getSensorReadingsCount();

    return res.json({
      hasRun: latest.run !== null,
      totalZones: zones.length,
      totalReadings,
      run: latest.run,
      leaks: latest.leaks,
      kpis: {
        totalZones: zones.length,
        zonesAnalysed: latest.run ? latest.run.zones_analysed : 0,
        suspectedLeaks: latest.run ? latest.run.leaks_detected : 0,
        estimatedWaterLossDay: latest.run ? latest.run.total_estimated_loss : 0,
        highestPriorityLeak: latest.run ? latest.run.highest_priority_zone : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getHistory(req: Request, res: Response) {
  try {
    const history = getAnalysisHistory();
    return res.json({ history });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
