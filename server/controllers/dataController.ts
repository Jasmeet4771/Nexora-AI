import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  insertSensorReadings,
  getSensorReadings,
  getSensorReadingsCount,
  getZoneList,
  clearSensorReadings,
  SensorReading,
} from '../database/db';

export function parseCsvContent(csvText: string): { valid: boolean; readings: SensorReading[]; errors: string[] } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { valid: false, readings: [], errors: ['CSV file is empty or lacks header/data rows.'] };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim());
  const requiredHeaders = ['timestamp', 'zone', 'latitude', 'longitude', 'pressure', 'flow', 'expected_pressure', 'expected_flow'];

  for (const req of requiredHeaders) {
    if (!headers.includes(req)) {
      return { valid: false, readings: [], errors: [`Missing required CSV header column: "${req}"`] };
    }
  }

  const tsIdx = headers.indexOf('timestamp');
  const zoneIdx = headers.indexOf('zone');
  const latIdx = headers.indexOf('latitude');
  const lngIdx = headers.indexOf('longitude');
  const pressIdx = headers.indexOf('pressure');
  const flowIdx = headers.indexOf('flow');
  const expPressIdx = headers.indexOf('expected_pressure');
  const expFlowIdx = headers.indexOf('expected_flow');

  const readings: SensorReading[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < headers.length) {
      errors.push(`Row ${i + 1}: Incomplete column count (expected ${headers.length}, got ${parts.length})`);
      continue;
    }

    const timestamp = parts[tsIdx];
    const zone = parts[zoneIdx].toUpperCase();
    const latitude = parseFloat(parts[latIdx]);
    const longitude = parseFloat(parts[lngIdx]);
    const pressure = parseFloat(parts[pressIdx]);
    const flow = parseFloat(parts[flowIdx]);
    const expected_pressure = parseFloat(parts[expPressIdx]);
    const expected_flow = parseFloat(parts[expFlowIdx]);

    if (!timestamp || !zone) {
      errors.push(`Row ${i + 1}: Missing timestamp or zone`);
      continue;
    }

    if (isNaN(latitude) || isNaN(longitude) || isNaN(pressure) || isNaN(flow) || isNaN(expected_pressure) || isNaN(expected_flow)) {
      errors.push(`Row ${i + 1}: Numerical conversion error in telemetry values`);
      continue;
    }

    readings.push({
      timestamp,
      zone,
      latitude,
      longitude,
      pressure,
      flow,
      expected_pressure,
      expected_flow,
    });
  }

  return {
    valid: readings.length > 0,
    readings,
    errors,
  };
}

// POST /api/data/import - imports sample CSV or provided CSV text
export async function importData(req: Request, res: Response) {
  try {
    let csvText = req.body?.csvText;
    let filename = req.body?.filename || 'sample_network_data.csv';

    // If no CSV provided, load default sample CSV from server
    if (!csvText) {
      const samplePath = path.join(process.cwd(), 'server', 'sample-data', 'sample_network_data.csv');
      if (fs.existsSync(samplePath)) {
        csvText = fs.readFileSync(samplePath, 'utf-8');
      } else {
        return res.status(404).json({ error: 'Sample CSV file not found on server.' });
      }
    }

    const { valid, readings, errors } = parseCsvContent(csvText);
    if (!valid || readings.length === 0) {
      return res.status(400).json({ error: 'Failed to parse CSV data.', details: errors });
    }

    if (req.body?.overwrite === true || req.body?.clear === true) {
      clearSensorReadings();
    }

    const insertedCount = insertSensorReadings(readings);
    const zones = getZoneList();

    return res.json({
      success: true,
      message: `Successfully imported ${insertedCount} sensor readings across ${zones.length} zones.`,
      filename,
      recordsImported: insertedCount,
      zonesCount: zones.length,
      zones: zones.map((z) => z.zone),
      warnings: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while importing data.' });
  }
}

// POST /api/data/upload - uploads custom CSV file
export async function uploadData(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const csvContent = file.buffer.toString('utf-8');
    const { valid, readings, errors } = parseCsvContent(csvContent);

    if (!valid || readings.length === 0) {
      return res.status(400).json({
        error: 'Invalid CSV format or no valid rows found.',
        details: errors,
      });
    }

    const overwrite = req.body.overwrite === 'true' || req.body.overwrite === true;
    if (overwrite) {
      clearSensorReadings();
    }

    const inserted = insertSensorReadings(readings);
    const zones = getZoneList();

    return res.json({
      success: true,
      filename: file.originalname,
      message: `Successfully uploaded and imported ${inserted} readings for ${zones.length} zones.`,
      recordsImported: inserted,
      zonesCount: zones.length,
      warnings: errors.slice(0, 5),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Upload processing failed.' });
  }
}

// GET /api/data - query sensor readings
export async function getData(req: Request, res: Response) {
  try {
    const limit = Math.min(500, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const zone = req.query.zone as string | undefined;
    const search = req.query.search as string | undefined;

    const readings = getSensorReadings(limit, offset, zone, search);
    const total = getSensorReadingsCount();

    return res.json({
      total,
      limit,
      offset,
      readings,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/zones - list unique zones
export async function getZones(req: Request, res: Response) {
  try {
    const zones = getZoneList();
    return res.json({ zones });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
