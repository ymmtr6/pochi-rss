/**
 * pochi-rss メインエントリーポイント
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
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

// 管理画面配信エンドポイント（Workers Sites）
const serveAdmin = async (c: Context<{ Bindings: Env }>) => {
  try {
    const hasAssetsBinding = !!c.env.ASSETS;
    const hasWorkersSite =
      !!c.env.__STATIC_CONTENT && !!c.env.__STATIC_CONTENT_MANIFEST;

    // 静的アセットが利用可能かチェック
    if (!hasAssetsBinding && !hasWorkersSite) {
      // 開発環境: React開発サーバーを使用するように案内
      return c.html(`
        <!DOCTYPE html>
        <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>pochi-rss 管理画面</title>
          </head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 100px auto; padding: 20px;">
            <h1>pochi-rss 管理画面</h1>
            <p>開発環境では、React開発サーバーを使用してください。</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">npm run dev:ui</pre>
            <p>その後、以下のURLにアクセスしてください：</p>
            <p><a href="http://localhost:5173/admin">http://localhost:5173/admin</a></p>
            <hr style="margin: 30px 0;">
            <p style="color: #666;">本番環境では、この画面は自動的にReact管理画面として表示されます。</p>
          </body>
        </html>
      `);
    }

    const url = new URL(c.req.url);

    // /admin 配下を静的バケットのルートにマッピング
    if (url.pathname === '/admin') {
      url.pathname = '/admin/';
    }
    if (url.pathname.startsWith('/admin/')) {
      url.pathname = url.pathname.replace(/^\/admin/, '');
    }

    // SPAのため、拡張子がないパスは index.html にフォールバック
    if (!url.pathname.match(/\.\w+$/)) {
      url.pathname = '/index.html';
    }

    const request = new Request(url.toString(), c.req.raw);

    if (hasAssetsBinding && c.env.ASSETS) {
      return c.env.ASSETS.fetch(request);
    }

    const asset = await getAssetFromKV(
      {
        request,
        waitUntil: () => {},
      } as any,
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: c.env.__STATIC_CONTENT_MANIFEST,
      }
    );

    return asset;
  } catch (error) {
    console.error('Error serving admin UI:', error);
    return c.notFound();
  }
};

app.get('/admin', serveAdmin);
app.get('/admin/*', serveAdmin);

export default app;
