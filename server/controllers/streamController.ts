import { Request, Response } from 'express';
import { sensorStreamService, StreamSpeed } from '../services/sensorStreamService';

// GET /api/stream/telemetry - SSE endpoint for live telemetry stream
export function streamTelemetry(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  sensorStreamService.subscribeClient(res);

  // Send keepalive ping every 25 seconds to prevent proxy timeouts
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
}

// POST /api/stream/generate - Manually triggers an immediate 5-minute SCADA telemetry packet
export async function generateTelemetryPacket(req: Request, res: Response) {
  try {
    const packet = await sensorStreamService.generateAndBroadcastTelemetry();
    return res.json({
      success: true,
      message: `Generated 5-minute SCADA telemetry packet #${packet.packetId} (${packet.timestamp}) for ${packet.zonesCount} zones.`,
      packet,
      status: sensorStreamService.getStatus(),
    });
  } catch (error: any) {
    console.error('Error generating telemetry packet:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate telemetry packet' });
  }
}

// POST /api/stream/config - Set stream cadence (5m, 1m, 15s, paused)
export function configureStream(req: Request, res: Response) {
  try {
    const cadence = req.body?.cadence as StreamSpeed;
    if (!['5m', '1m', '15s', 'paused'].includes(cadence)) {
      return res.status(400).json({ error: 'Invalid cadence. Expected "5m", "1m", "15s", or "paused".' });
    }

    sensorStreamService.setCadence(cadence);
    return res.json({
      success: true,
      message: `SCADA telemetry stream cadence updated to ${cadence}.`,
      status: sensorStreamService.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/stream/status - Get current telemetry stream status
export function getStreamStatus(req: Request, res: Response) {
  try {
    return res.json({ status: sensorStreamService.getStatus() });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
