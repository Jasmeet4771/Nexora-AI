import { Request, Response } from 'express';
import { createWorkerDispatch, getDispatches, getLeakById } from '../database/db';

export async function createDispatch(req: Request, res: Response) {
  try {
    const { leak_id, report_id, worker_team, priority, message } = req.body;

    if (!leak_id || !worker_team || !priority || !message) {
      return res.status(400).json({
        error: 'Missing required dispatch fields: leak_id, worker_team, priority, and message.',
      });
    }

    const leak = getLeakById(Number(leak_id));
    if (!leak) {
      return res.status(404).json({ error: 'Leak record not found' });
    }

    const dispatchRecord = createWorkerDispatch({
      leak_id: Number(leak_id),
      report_id: report_id ? Number(report_id) : null,
      worker_team: String(worker_team),
      priority: String(priority),
      message: String(message),
    });

    return res.json({
      success: true,
      message: `Report successfully sent to ${worker_team}.`,
      dispatch: dispatchRecord,
      zone: leak.zone,
    });
  } catch (error: any) {
    console.error('Dispatch creation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch report.' });
  }
}

export async function listDispatches(req: Request, res: Response) {
  try {
    const dispatches = getDispatches();
    return res.json({ dispatches });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
