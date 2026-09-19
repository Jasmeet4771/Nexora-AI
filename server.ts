import express from 'express';
import path from 'path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api';
import { getSensorReadingsCount, insertSensorReadings } from './server/database/db';
import { parseCsvContent } from './server/controllers/dataController';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and urlencoded data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed sample data on initial startup if database is empty
  try {
    const existingCount = getSensorReadingsCount();
    if (existingCount === 0) {
      const samplePath = path.join(process.cwd(), 'server', 'sample-data', 'sample_network_data.csv');
      if (fs.existsSync(samplePath)) {
        const content = fs.readFileSync(samplePath, 'utf-8');
        const parsed = parseCsvContent(content);
        if (parsed.valid && parsed.readings.length > 0) {
          insertSensorReadings(parsed.readings);
          console.log(`[Nexora AI] Auto-seeded ${parsed.readings.length} initial sensor records.`);
        }
      }
    }
  } catch (err) {
    console.warn('[Nexora AI] Initial data seed notice:', err);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Nexora AI - Municipal Water Intelligence API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API router FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexora AI] Server operational at http://0.0.0.0:${PORT}`);
  });
}

startServer();
