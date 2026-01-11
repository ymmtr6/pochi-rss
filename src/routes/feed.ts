/**
 * フィード配信エンドポイント
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { getSiteConfig, getAllSiteConfigs } from '../services/config-manager';
import { getRSSCache, setRSSCache } from '../services/cache';
import { scrapeWebsite } from '../services/scraper';
import { generateRSS } from '../services/rss-generator';

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
      return c.json(
        {
          error: 'Not Found',
          message: `Site config not found: ${siteId}`,
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

    // スクレイピング実行
    const items = await scrapeWebsite(config);

    // RSS生成
    const rss = generateRSS({
      title: config.feed.title,
      description: config.feed.description,
      link: config.feed.link,
      items,
    });

    // キャッシュに保存
    await setRSSCache(c.env.RSS_STORE, siteId, rss, config.cacheTTL);

    return c.body(rss, 200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    });
  } catch (error) {
    console.error(`Error generating feed for ${siteId}:`, error);

    // エラー時は古いキャッシュがあれば返す
    const cached = await getRSSCache(c.env.RSS_STORE, siteId);
    if (cached) {
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

export default feed;
