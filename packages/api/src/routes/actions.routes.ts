import express from 'express';
import { listPendingActions, getAction, approveAction as storeApproveAction } from '../actions/action.store';
import { listAudit } from '../actions/action.audit';
import { executeAction } from '../actions/action.executor';

const router = express.Router();

router.get('/api/actions/pending', (_req, res) => {
  return res.json({ success: true, actions: listPendingActions() });
});

router.get('/api/actions/audit', (req, res) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const entries = listAudit().slice(-limit);
  return res.json({ success: true, audit: entries });
});

router.get('/api/actions/:id', (req, res) => {
  const action = getAction(req.params.id);
  if (!action) return res.status(404).json({ success: false, error: 'Action not found' });
  return res.json({ success: true, action });
});

router.post('/api/actions/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approvedBy, notes } = req.body || {};
  const updated = storeApproveAction(id, approvedBy || 'system', notes);
  if (!updated) return res.status(404).json({ success: false, error: 'Action not found' });
  return res.json({ success: true, action: updated });
});

router.post('/api/actions/:id/execute', async (req, res) => {
  const { id } = req.params;
  const mode = (req.body?.mode as 'PLAN' | 'EXECUTE') || 'PLAN';
  const action = getAction(id);
  if (!action) return res.status(404).json({ success: false, error: 'Action not found' });
  const receipt = await executeAction(action, { mode, approvedBy: req.body?.approvedBy });
  return res.json({ success: true, receipt });
});

export default router;
