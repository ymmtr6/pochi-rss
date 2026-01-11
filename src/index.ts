/**
 * pochi-rss メインエントリーポイント
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/bindings';
import feed from './routes/feed';
import admin from './routes/admin';
import { getAllSiteConfigs } from './services/config-manager';

const app = new Hono<{ Bindings: Env }>();

// CORS設定
app.use('/*', cors());

// ルート
app.get('/', (c) => {
  return c.json({
    name: 'pochi-rss',
    version: '1.0.0',
    description: 'RSS Feed generator for websites without RSS support',
    endpoints: {
      feed: 'GET /feed/:site_id - RSSフィードを取得',
      sites: 'GET /sites - 利用可能なサイト一覧',
      admin: {
        create: 'POST /api/sites - サイト設定を作成 (要認証)',
        get: 'GET /api/sites/:site_id - サイト設定を取得 (要認証)',
        update: 'PUT /api/sites/:site_id - サイト設定を更新 (要認証)',
        delete: 'DELETE /api/sites/:site_id - サイト設定を削除 (要認証)',
      },
    },
  });
});

// サイト一覧エンドポイント
app.get('/sites', async (c) => {
  try {
    const configs = await getAllSiteConfigs(c.env.RSS_STORE);

    const sites = configs.map((config) => ({
      id: config.id,
      name: config.name,
      feedUrl: `/feed/${config.id}`,
    }));

    return c.json({
      sites,
      count: sites.length,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch sites',
      },
      500
    );
  }
});

// フィード配信エンドポイント
app.route('/feed', feed);

// 管理用APIエンドポイント
app.route('/api', admin);

export default app;
