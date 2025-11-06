/**
 * Analytics API Router - Phase 3
 * Exposes analytics endpoints for dashboard consumption
 */

import { Router, Request, Response } from 'express';
import { analyticsService } from './analytics.service';

const router = Router();

/**
 * GET /api/analytics/metrics
 * Get comprehensive dashboard metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const founderEmail = req.query.founder as string || 'darnell@elevatedmovements.com';

    const metrics = await analyticsService.getDashboardMetrics(founderEmail);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Analytics API] Get metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Get activity timeline
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const founderEmail = req.query.founder as string || 'darnell@elevatedmovements.com';
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 50;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await analyticsService.getActivityTimeline(
      founderEmail,
      startDate,
      endDate,
      limit
    );

    res.json({
      success: true,
      data: timeline,
      count: timeline.length,
    });
  } catch (error) {
    console.error('[Analytics API] Get timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline',
    });
  }
});

/**
 * GET /api/analytics/trends
 * Get productivity trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const founderEmail = req.query.founder as string || 'darnell@elevatedmovements.com';
    const days = parseInt(req.query.days as string) || 30;

    const trends = await analyticsService.getProductivityTrends(founderEmail, days);

    res.json({
      success: true,
      data: trends,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('[Analytics API] Get trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
    });
  }
});

/**
 * GET /api/analytics/health
 * Get health score
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const founderEmail = req.query.founder as string || 'darnell@elevatedmovements.com';

    const score = await analyticsService.getHealthScore(founderEmail);

    res.json({
      success: true,
      data: {
        score,
        level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'needs improvement',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics API] Get health score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health score',
    });
  }
});

export default router;
