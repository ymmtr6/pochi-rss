/**
 * フィード配信エンドポイント
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { getSiteConfig, getAllSiteConfigs } from '../services/config-manager';
import { getRSSCache, setRSSCache, getRSSItemsCache, setRSSItemsCache } from '../services/cache';
import { scrapeWebsite } from '../services/scraper';
import { generateRSS } from '../services/rss-generator';
import { logger } from '../utils/logger';
import { ErrorCode } from '../config/types';

const feed = new Hono<{ Bindings: Env }>();

/**
 * GET /feed/:site_id
 * 指定されたサイトのRSSフィードを取得
 */
feed.get('/:site_id', async (c) => {
  const siteId = c.req.param('site_id');

  try {
    // サイト設定を取得
    const config = await getSiteConfig(c.env.RSS_STORE, siteId);

    if (!config) {
      logger.warn('Site config not found', {
        siteId,
        endpoint: `/feed/${siteId}`,
      });
      return c.json(
        {
          error: 'Not Found',
          message: `Site config not found: ${siteId}`,
          code: ErrorCode.CONFIG_NOT_FOUND,
          timestamp: new Date().toISOString(),
        },
        404
      );
    }

    // キャッシュを確認
    const cached = await getRSSCache(c.env.RSS_STORE, siteId);
    if (cached) {
      return c.body(cached, 200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      });
    }

    // 既存アイテムキャッシュを取得（pubDateのフォールバック用）
    const cachedItems = await getRSSItemsCache(c.env.RSS_STORE, siteId);

    // スクレイピング実行
    const items = await scrapeWebsite(config, cachedItems);

    // RSS生成
    const rss = generateRSS({
      title: config.feed.title,
      description: config.feed.description,
      link: config.feed.link,
      items,
    });

    // キャッシュに保存（RSSとアイテム両方）
    await setRSSCache(c.env.RSS_STORE, siteId, rss, config.cacheTTL);
    await setRSSItemsCache(c.env.RSS_STORE, siteId, items, config.cacheTTL);

    return c.body(rss, 200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    });
  } catch (error) {
    logger.error(`Error generating feed for ${siteId}`, error as Error, {
      siteId,
      endpoint: `/feed/${siteId}`,
    });

    // エラー時は古いキャッシュがあれば返す
    const cached = await getRSSCache(c.env.RSS_STORE, siteId);
    if (cached) {
      logger.info('Serving stale cache after error', {
        siteId,
      });
      return c.body(cached, 200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'X-Served-From-Cache': 'true',
      });
    }

    return c.json(
      {
        error: 'Internal Server Error',
        message:
          error instanceof Error ? error.message : 'Failed to generate feed',
        code: ErrorCode.SCRAPING_FAILED,
        timestamp: new Date().toISOString(),
      },
      502
    );
  }
});

/**
 * GET /sites
 * 利用可能なサイト一覧を取得
 */
feed.get('/', async (c) => {
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
    logger.error('Error fetching sites', error as Error, {
      endpoint: '/feed',
    });
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch sites',
        code: ErrorCode.INTERNAL_ERROR,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

export default feed;
