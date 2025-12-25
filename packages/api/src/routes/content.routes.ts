import express from 'express';
import { generateContentPack } from '../services/contentPack.service';
import { getContentPack, listContentPacks } from '../content/contentPack.store';
import { runWeeklyContentPack } from '../services/contentWeek.service';

const router = express.Router();

router.post('/content/packs/generate', async (req, res) => {
  try {
    const { userId, topic, includeP0 } = req.body || {};
    if (!userId || !topic) {
      return res.status(400).json({ success: false, error: 'userId and topic are required' });
    }
    const pack = await generateContentPack({ userId, topic, includeP0 });
    return res.json({ success: true, pack });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate content pack' });
  }
});

router.get('/content/packs', (req, res) => {
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const packs = listContentPacks(limit);
  return res.json({ success: true, packs });
});

router.get('/content/packs/:packId', (req, res) => {
  const pack = getContentPack(req.params.packId);
  if (!pack) return res.status(404).json({ success: false, error: 'Not found' });
  return res.json({ success: true, pack });
});

router.post('/content/week', async (req, res) => {
  const { scope, channels, focus, tone } = req.body || {};
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ success: false, error: 'channels must include at least one entry' });
  }
  try {
    const pack = await runWeeklyContentPack({
      scope: scope || 'elevated_movements',
      channels,
      focus: focus || 'default',
      tone: tone || 'standard_week',
    });
    return res.json({ success: true, pack });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to generate content week pack' });
  }
});

export default router;
