/**
 * ヘルスチェックエンドポイント
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { metrics } from '../utils/metrics';

const health = new Hono<{ Bindings: Env }>();

/**
 * GET /health
 * サービスのヘルスチェック
 */
health.get('/', (c) => {
  const metricsData = metrics.getMetrics();

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    metrics: metricsData,
  });
});

export default health;
