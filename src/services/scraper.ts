/**
 * スクレイピングサービス
 */

import type { SiteConfig, RSSItem } from '../config/types';
import { isValidUrl } from './config-manager';
import { fetchAndLoadHtml, extractItems } from '../utils/scraper-helpers';

/**
 * 対象サイトをスクレイピングしてRSS記事アイテムを取得
 */
export async function scrapeWebsite(
  config: SiteConfig,
  cachedItems: RSSItem[] | null = null
): Promise<RSSItem[]> {
  try {
    // URLの形式検証
    if (!isValidUrl(config.url)) {
      throw new Error('Invalid URL format');
    }

    // HTMLを取得してロード
    const $ = await fetchAndLoadHtml(config.url);

    // 記事アイテムを抽出
    const items = extractItems($, config, config.url, { cachedItems });

    return items;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
    throw new Error('Scraping failed: Unknown error');
  }
}
