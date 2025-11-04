import { Router } from 'express';
import { z } from 'zod';
import { authBearer } from '../middleware/authBearer';
import { appendTurn, getSession, recall, remember } from '@em/context-memory';

const router = Router();

router.use(authBearer);

const appendTurnSchema = z.object({
  founder: z.string().min(1, 'founder is required'),
  text: z.string().min(1, 'text is required'),
  entities: z.record(z.unknown()).optional(),
  ts: z.union([z.string(), z.number(), z.date()]).optional(),
});

router.post('/turn', async (req, res) => {
  const parsed = appendTurnSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid request body',
      issues: parsed.error.flatten(),
    });
    return;
  }

  try {
    const turn = await appendTurn(parsed.data);
    res.status(200).json({ status: 'ok', turn });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to append turn',
    });
  }
});

const sessionQuerySchema = z.object({
  founder: z.string().min(1, 'founder is required'),
  limit: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().positive())
    .optional(),
});

router.get('/session', async (req, res) => {
  const parsed = sessionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      issues: parsed.error.flatten(),
    });
    return;
  }

  try {
    const turns = await getSession({ founder: parsed.data.founder, limit: parsed.data.limit });
    res.status(200).json({ status: 'ok', turns });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch session',
    });
  }
});

const memoryBodySchema = z.object({
  founder: z.string().min(1, 'founder is required'),
  key: z.string().min(1, 'key is required'),
  value: z.unknown(),
  source: z.string().optional(),
});

router.post('/memory', async (req, res) => {
  const parsed = memoryBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid request body',
      issues: parsed.error.flatten(),
    });
    return;
  }

  try {
    const record = await remember(parsed.data);
    res.status(201).json({ status: 'ok', record });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to persist memory',
    });
  }
});

const memoryQuerySchema = z.object({
  founder: z.string().min(1, 'founder is required'),
  key: z.string().min(1, 'key is required'),
});

router.get('/memory', async (req, res) => {
  const parsed = memoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      issues: parsed.error.flatten(),
    });
    return;
  }

  try {
    const record = await recall(parsed.data);
    if (!record) {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    res.status(200).json({ status: 'ok', record });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to retrieve memory',
    });
  }
});

export default router;
