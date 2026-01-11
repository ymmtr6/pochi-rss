/**
 * スクレイピングサービス
 */

import * as cheerio from 'cheerio';
import type { SiteConfig, RSSItem } from '../config/types';

/**
 * 対象サイトをスクレイピングしてRSS記事アイテムを取得
 */
export async function scrapeWebsite(
  config: SiteConfig
): Promise<RSSItem[]> {
  try {
    // タイムアウト設定（10秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(config.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'pochi-rss/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${config.url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items: RSSItem[] = [];

    // 記事一覧を取得
    $(config.selectors.items).each((_, element) => {
      const $item = $(element);

      // タイトルを取得
      const title = $item.find(config.selectors.title).text().trim();

      // リンクを取得
      let link = $item.find(config.selectors.link).attr('href') || '';

      // 相対URLを絶対URLに変換
      if (link && !link.startsWith('http')) {
        const baseUrl = new URL(config.url);
        if (link.startsWith('/')) {
          link = `${baseUrl.origin}${link}`;
        } else {
          link = `${baseUrl.origin}/${link}`;
        }
      }

      // タイトルとリンクが必須
      if (!title || !link) {
        return;
      }

      const item: RSSItem = {
        title,
        link,
      };

      // 説明（オプション）
      if (config.selectors.description) {
        const description = $item
          .find(config.selectors.description)
          .text()
          .trim();
        if (description) {
          item.description = description;
        }
      }

      // 公開日（オプション）
      if (config.selectors.pubDate) {
        const pubDate = $item
          .find(config.selectors.pubDate)
          .text()
          .trim();
        if (pubDate) {
          item.pubDate = pubDate;
        }
      }

      // 著者（オプション）
      if (config.selectors.author) {
        const author = $item
          .find(config.selectors.author)
          .text()
          .trim();
        if (author) {
          item.author = author;
        }
      }

      items.push(item);
    });

    return items;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw new Error(`Scraping failed: ${error.message}`);
    }
    throw new Error('Scraping failed: Unknown error');
  }
}
