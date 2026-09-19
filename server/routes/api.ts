import { Router } from 'express';
import multer from 'multer';
import { uploadData, importData, getData, getZones } from '../controllers/dataController';
import { runAnalysis, getLatest, getHistory } from '../controllers/analysisController';
import {
  getLeaks,
  getLeak,
  createAiReport,
  getReport,
  downloadPdf,
  getNetwork,
} from '../controllers/leakController';
import { createDispatch, listDispatches } from '../controllers/dispatchController';
import {
  streamTelemetry,
  generateTelemetryPacket,
  configureStream,
  getStreamStatus,
} from '../controllers/streamController';

const upload = multer({ storage: multer.memoryStorage() });
export const apiRouter = Router();

// Stream endpoints (Real-Time 5-minute SCADA Ingestion)
apiRouter.get('/stream/telemetry', streamTelemetry);
apiRouter.post('/stream/generate', generateTelemetryPacket);
apiRouter.post('/stream/config', configureStream);
apiRouter.get('/stream/status', getStreamStatus);

// Data endpoints
apiRouter.post('/data/upload', upload.single('file'), uploadData);
apiRouter.post('/data/import', importData);
apiRouter.get('/data', getData);
apiRouter.get('/zones', getZones);

// Analysis endpoints
apiRouter.post('/analysis/run', runAnalysis);
apiRouter.get('/analysis/latest', getLatest);
apiRouter.get('/analysis/history', getHistory);

// Leaks endpoints
apiRouter.get('/leaks', getLeaks);
apiRouter.get('/leaks/:id', getLeak);
apiRouter.post('/leaks/:id/ai-report', createAiReport);
apiRouter.get('/leaks/:id/pdf', downloadPdf);

// Network endpoints
apiRouter.get('/network', getNetwork);

// Dispatch endpoints
apiRouter.post('/dispatch', createDispatch);
apiRouter.get('/dispatch', listDispatches);

// Reports endpoints
apiRouter.get('/reports/:id', getReport);
apiRouter.get('/reports/:id/pdf', downloadPdf);
