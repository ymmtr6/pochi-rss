/**
 * スクレイピングサービス
 */

import * as cheerio from 'cheerio';
import type { SiteConfig, RSSItem } from '../config/types';
import { parseJapaneseDate } from '../utils/date-parser';

/**
 * 対象サイトをスクレイピングしてRSS記事アイテムを取得
 */
export async function scrapeWebsite(
  config: SiteConfig,
  cachedItems: RSSItem[] | null = null
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

    // 既存アイテムのキャッシュをMapに変換（タイトル+リンクをキーにする）
    const cachedItemsMap = new Map<string, RSSItem>();
    if (cachedItems) {
      for (const cachedItem of cachedItems) {
        const key = `${cachedItem.title}|||${cachedItem.link}`;
        cachedItemsMap.set(key, cachedItem);
      }
    }

    // 記事一覧を取得
    $(config.selectors.items).each((_, element) => {
      const $item = $(element);

      // タイトルを取得
      const title = $item.find(config.selectors.title).text().trim();

      // リンクを取得
      let link = $item.find(config.selectors.link).attr('href') || '';

      // linkが見つからない場合、item自体がリンク要素かチェック
      if (!link) {
        link = $item.attr('href') || '';
      }

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

      // 説明（オプション）
      let description: string | undefined;
      if (config.selectors.description) {
        const desc = $item
          .find(config.selectors.description)
          .text()
          .trim();
        if (desc) {
          description = desc;
        }
      }

      // 公開日（必須、フォールバック処理あり）
      let pubDate: string | undefined;
      if (config.selectors.pubDate) {
        const extracted = $item
          .find(config.selectors.pubDate)
          .text()
          .trim();
        if (extracted) {
          // 日本語日付をパースしてISO形式に変換
          const parsed = parseJapaneseDate(extracted);
          if (parsed) {
            pubDate = parsed;
          }
        }
      }

      // pubDateが取れなかった場合のフォールバック処理
      if (!pubDate) {
        // 既存キャッシュから同名アイテムを探す
        const cacheKey = `${title}|||${link}`;
        const cachedItem = cachedItemsMap.get(cacheKey);

        if (cachedItem) {
          // キャッシュに同名アイテムがあればそのpubDateを使用
          pubDate = cachedItem.pubDate;
        } else {
          // キャッシュにもない場合は現在時刻を使用
          pubDate = new Date().toISOString();
        }
      }

      // 著者（オプション）
      let author: string | undefined;
      if (config.selectors.author) {
        const auth = $item
          .find(config.selectors.author)
          .text()
          .trim();
        if (auth) {
          author = auth;
        }
      }

      const item: RSSItem = {
        title,
        link,
        description,
        pubDate,
        author,
      };

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
