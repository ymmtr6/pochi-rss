/**
 * 管理用APIエンドポイント
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { authMiddleware } from '../middlewares/auth';
import {
  getSiteConfig,
  saveSiteConfig,
  deleteSiteConfig,
  validateSiteConfig,
  validateSiteConfigDetailed,
  isValidUrl,
  isValidSelector,
} from '../services/config-manager';
import { deleteRSSCache, deleteRSSItemsCache } from '../services/cache';
import {
  testSelectors,
  type SelectorTestRequest,
} from '../services/selector-test';
import type { SiteConfig } from '../config/types';

const admin = new Hono<{ Bindings: Env }>();

// すべてのエンドポイントに認証を適用
admin.use('/*', authMiddleware);

/**
 * POST /api/sites
 * 新しいサイト設定を追加
 */
admin.post('/sites', async (c) => {
  try {
    const body = await c.req.json();

    // 詳細なバリデーション
    const validation = validateSiteConfigDetailed(body);
    if (!validation.valid) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid site configuration',
          details: validation.errors,
        },
        400
      );
    }

    const config: SiteConfig = body;

    // 既存の設定をチェック
    const existing = await getSiteConfig(c.env.RSS_STORE, config.id);
    if (existing) {
      return c.json(
        {
          error: 'Conflict',
          message: `Site config already exists: ${config.id}`,
        },
        409
      );
    }

    // 設定を保存
    await saveSiteConfig(c.env.RSS_STORE, config);

    return c.json(
      {
        message: 'Site config created successfully',
        id: config.id,
      },
      201
    );
  } catch (error) {
    console.error('Error creating site config:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create site config',
      },
      500
    );
  }
});

/**
 * GET /api/sites/:site_id
 * 特定のサイト設定を取得
 */
admin.get('/sites/:site_id', async (c) => {
  const siteId = c.req.param('site_id');

  try {
    const config = await getSiteConfig(c.env.RSS_STORE, siteId);

    if (!config) {
      return c.json(
        {
          error: 'Not Found',
          message: `Site config not found: ${siteId}`,
        },
        404
      );
    }

    return c.json(config);
  } catch (error) {
    console.error(`Error fetching site config ${siteId}:`, error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch site config',
      },
      500
    );
  }
});

/**
 * PUT /api/sites/:site_id
 * サイト設定を更新
 */
admin.put('/sites/:site_id', async (c) => {
  const siteId = c.req.param('site_id');

  try {
    const body = await c.req.json();

    // 既存の設定を取得
    const existing = await getSiteConfig(c.env.RSS_STORE, siteId);
    if (!existing) {
      return c.json(
        {
          error: 'Not Found',
          message: `Site config not found: ${siteId}`,
        },
        404
      );
    }

    // 設定をマージ
    const updated: SiteConfig = {
      ...existing,
      ...body,
      id: siteId, // IDは変更不可
    };

    // 詳細なバリデーション
    const validation = validateSiteConfigDetailed(updated);
    if (!validation.valid) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid site configuration',
          details: validation.errors,
        },
        400
      );
    }

    // 設定を保存
    await saveSiteConfig(c.env.RSS_STORE, updated);

    // 関連キャッシュを削除（RSSとアイテム両方）
    await deleteRSSCache(c.env.RSS_STORE, siteId);
    await deleteRSSItemsCache(c.env.RSS_STORE, siteId);

    return c.json({
      message: 'Site config updated successfully',
      id: siteId,
    });
  } catch (error) {
    console.error(`Error updating site config ${siteId}:`, error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update site config',
      },
      500
    );
  }
});

/**
 * DELETE /api/sites/:site_id
 * サイト設定を削除
 */
admin.delete('/sites/:site_id', async (c) => {
  const siteId = c.req.param('site_id');

  try {
    // 既存の設定を確認
    const existing = await getSiteConfig(c.env.RSS_STORE, siteId);
    if (!existing) {
      return c.json(
        {
          error: 'Not Found',
          message: `Site config not found: ${siteId}`,
        },
        404
      );
    }

    // 設定を削除
    await deleteSiteConfig(c.env.RSS_STORE, siteId);

    // 関連キャッシュを削除（RSSとアイテム両方）
    await deleteRSSCache(c.env.RSS_STORE, siteId);
    await deleteRSSItemsCache(c.env.RSS_STORE, siteId);

    return c.json({
      message: 'Site config deleted successfully',
      id: siteId,
    });
  } catch (error) {
    console.error(`Error deleting site config ${siteId}:`, error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete site config',
      },
      500
    );
  }
});

/**
 * POST /api/test-selectors
 * セレクタをテストして抽出結果を返す
 */
admin.post('/test-selectors', async (c) => {
  try {
    const body = await c.req.json();

    // バリデーション
    if (!body.url || !body.selectors) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Missing required fields: url and selectors',
        },
        400
      );
    }

    // URLの検証
    if (!isValidUrl(body.url)) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid URL',
          details: ['url must be a valid HTTP/HTTPS URL'],
        },
        400
      );
    }

    // セレクタの検証
    const selectorErrors: string[] = [];
    if (typeof body.selectors !== 'object' || body.selectors === null) {
      selectorErrors.push('selectors must be an object');
    } else {
      const required = ['items', 'title', 'link'];
      for (const field of required) {
        if (typeof body.selectors[field] !== 'string') {
          selectorErrors.push(`selectors.${field} is required and must be a string`);
        } else if (!isValidSelector(body.selectors[field])) {
          selectorErrors.push(`selectors.${field} is not a valid CSS selector`);
        }
      }

      // オプションセレクタの検証
      const optional = ['description', 'pubDate', 'author'];
      for (const field of optional) {
        if (
          body.selectors[field] !== undefined &&
          typeof body.selectors[field] === 'string' &&
          body.selectors[field].length > 0
        ) {
          if (!isValidSelector(body.selectors[field])) {
            selectorErrors.push(`selectors.${field} is not a valid CSS selector`);
          }
        }
      }
    }

    if (selectorErrors.length > 0) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Invalid selectors',
          details: selectorErrors,
        },
        400
      );
    }

    const request: SelectorTestRequest = body;

    // セレクタテスト実行
    const items = await testSelectors(request);

    return c.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error testing selectors:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        items: [],
      },
      500
    );
  }
});

export default admin;
