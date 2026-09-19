import { Request, Response } from 'express';
import {
  getLatestAnalysis,
  getLeakById,
  saveAiReport,
  getAiReportById,
  getZoneList,
  db,
  LeakResult,
} from '../database/db';
import { generateInvestigationReport, AiInvestigationReport } from '../services/aiService';
import { generatePdfReport } from '../services/pdfService';

export async function getLeaks(req: Request, res: Response) {
  try {
    const latest = getLatestAnalysis();
    return res.json({
      analysis_id: latest.run?.id || null,
      leaks: latest.leaks,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getLeak(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid leak ID' });
    }

    const leak = getLeakById(id);
    if (!leak) {
      return res.status(404).json({ error: 'Leak record not found' });
    }

    return res.json({ leak });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createAiReport(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid leak ID' });
    }

    const leak = getLeakById(id);
    if (!leak) {
      return res.status(404).json({ error: 'Leak record not found' });
    }

    // Generate report via Gemini API (with robust fallback)
    const reportData = await generateInvestigationReport(leak);

    // Save to database
    const reportId = saveAiReport(leak.id, reportData);

    return res.json({
      success: true,
      reportId,
      report: {
        id: reportId,
        leak_id: leak.id,
        created_at: new Date().toISOString(),
        ...reportData,
      },
    });
  } catch (error: any) {
    console.error('AI Report generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate AI report' });
  }
}

export async function getReport(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const report = getAiReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    return res.json({ report });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function downloadPdf(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const leak = getLeakById(id);
    if (!leak) {
      return res.status(404).json({ error: 'Leak record not found' });
    }

    let aiReport: AiInvestigationReport;
    if (leak.ai_report && leak.ai_report.anomaly_summary) {
      aiReport = leak.ai_report;
    } else {
      aiReport = await generateInvestigationReport(leak);
    }

    const reportCode = leak.dispatch?.report_code || `NRX-${String(leak.id).padStart(3, '0')}`;
    const pdfBuffer = await generatePdfReport(leak, aiReport, reportCode);

    const filename = `NexoraAI_${leak.zone}_Investigation_Report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF download error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
}

export async function getNetwork(req: Request, res: Response) {
  try {
    const zones = getZoneList();
    const latest = getLatestAnalysis();
    const leaksByZone = new Map<string, LeakResult>();

    for (const l of latest.leaks) {
      leaksByZone.set(l.zone, l);
    }

    // Default coordinates if not in readings
    const defaultCoords: Record<string, [number, number]> = {
      B12: [30.3501, 76.8302],
      C07: [30.362, 76.845],
      A04: [30.338, 76.815],
      D02: [30.375, 76.82],
      E15: [30.331, 76.852],
      F09: [30.345, 76.865],
      G03: [30.358, 76.802],
    };

    const networkNodes = zones.map((z) => {
      const leak = leaksByZone.get(z.zone);
      const coords = defaultCoords[z.zone] || [z.latitude || 30.35, z.longitude || 76.83];

      let mapStatus: 'Normal' | 'Warning' | 'Suspected Leak' | 'Highest Priority' = 'Normal';
      let markerColor = 'GREEN';

      if (leak) {
        if (leak.rank === 1) {
          mapStatus = 'Highest Priority';
          markerColor = 'DARK RED';
        } else if (leak.status === 'CRITICAL' || leak.status === 'HIGH') {
          mapStatus = 'Suspected Leak';
          markerColor = 'RED';
        } else {
          mapStatus = 'Warning';
          markerColor = 'YELLOW';
        }
      }

      return {
        id: leak?.id || null,
        zone: z.zone,
        latitude: coords[0],
        longitude: coords[1],
        status: mapStatus,
        leakStatus: leak ? leak.status : 'Normal',
        markerColor,
        estimated_loss: leak ? leak.estimated_loss : 0,
        confidence: leak ? leak.confidence : 0,
        priority: leak ? `#${leak.rank}` : 'None',
        priority_score: leak ? leak.priority_score : 0,
        hasLeak: Boolean(leak),
      };
    });

    // Simulated pipeline grid connecting adjacent zones
    const pipelines = [
      { from: 'G03', to: 'A04', name: 'West Sector Trunk G-A' },
      { from: 'A04', to: 'B12', name: 'Central Feeder A-B' },
      { from: 'B12', to: 'D02', name: 'North Connector B-D' },
      { from: 'B12', to: 'C07', name: 'East Main B-C' },
      { from: 'C07', to: 'E15', name: 'Southeast Lateral C-E' },
      { from: 'C07', to: 'F09', name: 'East Ring F-C' },
      { from: 'E15', to: 'F09', name: 'South Perimeter E-F' },
    ];

    return res.json({
      label: 'Demo Network',
      notice: 'Simulated municipal water distribution grid for prototype demonstration.',
      nodes: networkNodes,
      pipelines,
      stats: {
        totalZones: zones.length,
        suspectedLeaks: latest.leaks.length,
        highestPriorityZone: latest.run?.highest_priority_zone || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
