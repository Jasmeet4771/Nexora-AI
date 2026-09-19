import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'nexora.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    zone TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    pressure REAL NOT NULL,
    flow REAL NOT NULL,
    expected_pressure REAL NOT NULL,
    expected_flow REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sensor_zone ON sensor_readings(zone);
  CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_readings(timestamp);

  CREATE TABLE IF NOT EXISTS analysis_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    readings_analysed INTEGER NOT NULL,
    zones_analysed INTEGER NOT NULL,
    leaks_detected INTEGER NOT NULL,
    total_estimated_loss REAL NOT NULL,
    highest_priority_zone TEXT
  );

  CREATE TABLE IF NOT EXISTS leak_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    zone TEXT NOT NULL,
    pressure_anomaly REAL NOT NULL,
    flow_anomaly REAL NOT NULL,
    estimated_loss REAL NOT NULL,
    confidence REAL NOT NULL,
    priority_score REAL NOT NULL,
    status TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    FOREIGN KEY(analysis_id) REFERENCES analysis_runs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leak_analysis ON leak_results(analysis_id);

  CREATE TABLE IF NOT EXISTS ai_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leak_id INTEGER NOT NULL,
    report TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(leak_id) REFERENCES leak_results(id)
  );

  CREATE TABLE IF NOT EXISTS worker_dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_code TEXT NOT NULL,
    leak_id INTEGER NOT NULL,
    report_id INTEGER,
    worker_team TEXT NOT NULL,
    priority TEXT NOT NULL,
    message TEXT NOT NULL,
    dispatched_at TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(leak_id) REFERENCES leak_results(id)
  );
`);

export interface SensorReading {
  id?: number;
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
  status: string;
  detected_at: string;
  latitude?: number;
  longitude?: number;
  expected_pressure?: number;
  actual_pressure?: number;
  expected_flow?: number;
  actual_flow?: number;
  rank?: number;
}

export interface AiReportRecord {
  id: number;
  leak_id: number;
  report: string;
  created_at: string;
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
}

// Database helper functions
export const insertSensorReadings = (readings: SensorReading[]) => {
  const insertStmt = db.prepare(`
    INSERT INTO sensor_readings (timestamp, zone, latitude, longitude, pressure, flow, expected_pressure, expected_flow)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const r of readings) {
      insertStmt.run(
        r.timestamp,
        r.zone,
        r.latitude,
        r.longitude,
        r.pressure,
        r.flow,
        r.expected_pressure,
        r.expected_flow
      );
    }
    db.exec('COMMIT;');
    return readings.length;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
};

export const clearSensorReadings = () => {
  db.exec('DELETE FROM sensor_readings;');
};

export const getSensorReadingsCount = (): number => {
  const row = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get() as { count: number };
  return row ? row.count : 0;
};

export const getSensorReadings = (limit = 100, offset = 0, zone?: string, search?: string) => {
  let query = 'SELECT * FROM sensor_readings';
  const params: any[] = [];
  const conditions: string[] = [];

  if (zone) {
    conditions.push('zone = ?');
    params.push(zone);
  }
  if (search) {
    conditions.push('(zone LIKE ? OR timestamp LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params) as unknown as SensorReading[];
};

export const getZoneList = (): { zone: string; count: number; latitude: number; longitude: number }[] => {
  return db.prepare(`
    SELECT zone, COUNT(*) as count, AVG(latitude) as latitude, AVG(longitude) as longitude
    FROM sensor_readings
    GROUP BY zone
    ORDER BY zone ASC
  `).all() as unknown as { zone: string; count: number; latitude: number; longitude: number }[];
};

export const getZoneHistory = (zone: string, limit = 50): SensorReading[] => {
  return db.prepare(`
    SELECT * FROM sensor_readings
    WHERE zone = ?
    ORDER BY timestamp ASC
    LIMIT ?
  `).all(zone, limit) as unknown as SensorReading[];
};

export const createAnalysisRun = (run: Omit<AnalysisRun, 'id'>): number => {
  const stmt = db.prepare(`
    INSERT INTO analysis_runs (started_at, completed_at, readings_analysed, zones_analysed, leaks_detected, total_estimated_loss, highest_priority_zone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    run.started_at,
    run.completed_at,
    run.readings_analysed,
    run.zones_analysed,
    run.leaks_detected,
    run.total_estimated_loss,
    run.highest_priority_zone
  );
  return Number(res.lastInsertRowid);
};

export const insertLeakResults = (leaks: Omit<LeakResult, 'id'>[]): void => {
  const stmt = db.prepare(`
    INSERT INTO leak_results (analysis_id, zone, pressure_anomaly, flow_anomaly, estimated_loss, confidence, priority_score, status, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const leak of leaks) {
    stmt.run(
      leak.analysis_id,
      leak.zone,
      leak.pressure_anomaly,
      leak.flow_anomaly,
      leak.estimated_loss,
      leak.confidence,
      leak.priority_score,
      leak.status,
      leak.detected_at
    );
  }
};

export const getLatestAnalysis = (): { run: AnalysisRun | null; leaks: LeakResult[] } => {
  const latestRun = db.prepare('SELECT * FROM analysis_runs ORDER BY id DESC LIMIT 1').get() as unknown as AnalysisRun | undefined;
  if (!latestRun) {
    return { run: null, leaks: [] };
  }

  const leaks = db.prepare(`
    SELECT l.*,
      (SELECT AVG(latitude) FROM sensor_readings WHERE zone = l.zone) as latitude,
      (SELECT AVG(longitude) FROM sensor_readings WHERE zone = l.zone) as longitude,
      (SELECT pressure FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as actual_pressure,
      (SELECT expected_pressure FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as expected_pressure,
      (SELECT flow FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as actual_flow,
      (SELECT expected_flow FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as expected_flow
    FROM leak_results l
    WHERE l.analysis_id = ?
    ORDER BY l.priority_score DESC
  `).all(latestRun.id) as unknown as LeakResult[];

  const rankedLeaks = leaks.map((l, idx) => ({ ...l, rank: idx + 1 }));
  return { run: latestRun, leaks: rankedLeaks };
};

export const getAnalysisHistory = (): AnalysisRun[] => {
  return db.prepare('SELECT * FROM analysis_runs ORDER BY id DESC LIMIT 20').all() as unknown as AnalysisRun[];
};

export const getLeakById = (id: number): (LeakResult & { readings: SensorReading[]; ai_report?: any; dispatch?: WorkerDispatchRecord }) | null => {
  const leak = db.prepare(`
    SELECT l.*,
      (SELECT AVG(latitude) FROM sensor_readings WHERE zone = l.zone) as latitude,
      (SELECT AVG(longitude) FROM sensor_readings WHERE zone = l.zone) as longitude,
      (SELECT pressure FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as actual_pressure,
      (SELECT expected_pressure FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as expected_pressure,
      (SELECT flow FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as actual_flow,
      (SELECT expected_flow FROM sensor_readings WHERE zone = l.zone ORDER BY timestamp DESC LIMIT 1) as expected_flow
    FROM leak_results l
    WHERE l.id = ?
  `).get(id) as unknown as LeakResult | undefined;

  if (!leak) return null;

  // calculate rank in its analysis run
  const allInRun = db.prepare('SELECT id FROM leak_results WHERE analysis_id = ? ORDER BY priority_score DESC').all(leak.analysis_id) as unknown as { id: number }[];
  const rankIdx = allInRun.findIndex((r) => r.id === leak.id);
  leak.rank = rankIdx >= 0 ? rankIdx + 1 : 1;

  const readings = getZoneHistory(leak.zone, 100);

  const reportRow = db.prepare('SELECT * FROM ai_reports WHERE leak_id = ? ORDER BY id DESC LIMIT 1').get(leak.id) as unknown as AiReportRecord | undefined;
  let aiReport = null;
  if (reportRow) {
    try {
      aiReport = {
        id: reportRow.id,
        created_at: reportRow.created_at,
        ...JSON.parse(reportRow.report),
      };
    } catch {
      aiReport = { id: reportRow.id, raw: reportRow.report };
    }
  }

  const dispatch = db.prepare('SELECT * FROM worker_dispatches WHERE leak_id = ? ORDER BY id DESC LIMIT 1').get(leak.id) as unknown as WorkerDispatchRecord | undefined;

  return {
    ...leak,
    readings,
    ai_report: aiReport,
    dispatch,
  };
};

export const saveAiReport = (leakId: number, reportData: any): number => {
  const stmt = db.prepare(`
    INSERT INTO ai_reports (leak_id, report, created_at)
    VALUES (?, ?, ?)
  `);
  const res = stmt.run(leakId, JSON.stringify(reportData), new Date().toISOString());
  return Number(res.lastInsertRowid);
};

export const getAiReportById = (id: number) => {
  const row = db.prepare('SELECT * FROM ai_reports WHERE id = ?').get(id) as unknown as AiReportRecord | undefined;
  if (!row) return null;
  try {
    return { id: row.id, leak_id: row.leak_id, created_at: row.created_at, ...JSON.parse(row.report) };
  } catch {
    return row;
  }
};

export const createWorkerDispatch = (dispatch: {
  leak_id: number;
  report_id?: number | null;
  worker_team: string;
  priority: string;
  message: string;
}): WorkerDispatchRecord => {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM worker_dispatches').get() as { count: number };
  const nextNum = (countRow ? countRow.count : 0) + 1;
  const reportCode = `NRX-${String(nextNum).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO worker_dispatches (report_code, leak_id, report_id, worker_team, priority, message, dispatched_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Dispatched')
  `);
  const res = stmt.run(
    reportCode,
    dispatch.leak_id,
    dispatch.report_id || null,
    dispatch.worker_team,
    dispatch.priority,
    dispatch.message,
    now
  );

  // Update leak_results status to 'Dispatched'
  db.prepare("UPDATE leak_results SET status = 'Dispatched' WHERE id = ?").run(dispatch.leak_id);

  return {
    id: Number(res.lastInsertRowid),
    report_code: reportCode,
    leak_id: dispatch.leak_id,
    report_id: dispatch.report_id,
    worker_team: dispatch.worker_team,
    priority: dispatch.priority,
    message: dispatch.message,
    dispatched_at: now,
    status: 'Dispatched',
  };
};

export const getDispatches = (): (WorkerDispatchRecord & { zone: string; estimated_loss: number; confidence: number })[] => {
  return db.prepare(`
    SELECT d.*, l.zone, l.estimated_loss, l.confidence
    FROM worker_dispatches d
    LEFT JOIN leak_results l ON d.leak_id = l.id
    ORDER BY d.id DESC
  `).all() as unknown as (WorkerDispatchRecord & { zone: string; estimated_loss: number; confidence: number })[];
};
