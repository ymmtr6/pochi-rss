/**
 * スクレイピング共通ヘルパー関数
 */

import * as cheerio from 'cheerio';
import type { RSSItem } from '../config/types';
import { parseJapaneseDate } from './date-parser';

/**
 * 抽出設定
 */
export interface ExtractConfig {
  selectors: {
    items: string;
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
  };
}

/**
 * 抽出オプション
 */
export interface ExtractOptions {
  /** 最大抽出数（デフォルト: 無制限） */
  limit?: number;
  /** キャッシュされたアイテム（pubDateのフォールバック用） */
  cachedItems?: RSSItem[] | null;
}

/**
 * URLを絶対URLに解決
 */
export function resolveUrl(url: string, baseUrl: string): string {
  if (!url) {
    return '';
  }

  // 既に絶対URLの場合はそのまま返す
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const base = new URL(baseUrl);

  // スラッシュで始まる場合はoriginと結合
  if (url.startsWith('/')) {
    return `${base.origin}${url}`;
  }

  // それ以外はoriginに/を追加して結合
  return `${base.origin}/${url}`;
}

/**
 * cheerioでHTMLから記事アイテムを抽出
 */
export function extractItems(
  $: cheerio.CheerioAPI,
  config: ExtractConfig,
  baseUrl: string,
  options: ExtractOptions = {}
): RSSItem[] {
  const { limit, cachedItems } = options;

  // キャッシュされたアイテムをMapに変換（タイトル+リンクをキーにする）
  const cachedItemsMap = new Map<string, RSSItem>();
  if (cachedItems) {
    for (const cachedItem of cachedItems) {
      const key = `${cachedItem.title}|||${cachedItem.link}`;
      cachedItemsMap.set(key, cachedItem);
    }
  }

  const items: RSSItem[] = [];

  // 記事一覧を取得
  let $items = $(config.selectors.items);

  // limitが指定されている場合は制限
  if (limit !== undefined && limit > 0) {
    $items = $items.slice(0, limit);
  }

  $items.each((_, element) => {
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
    link = resolveUrl(link, baseUrl);

    // タイトルとリンクが必須
    if (!title || !link) {
      return;
    }

    // 説明（オプション）
    let description: string | undefined;
    if (config.selectors.description) {
      const desc = $item.find(config.selectors.description).text().trim();
      if (desc) {
        description = desc;
      }
    }

    // 公開日（必須、フォールバック処理あり）
    let pubDate: string | undefined;
    if (config.selectors.pubDate) {
      const extracted = $item.find(config.selectors.pubDate).text().trim();
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
      const auth = $item.find(config.selectors.author).text().trim();
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
}

/**
 * URLからHTMLを取得してcheerioでロード
 */
export async function fetchAndLoadHtml(
  url: string,
  timeoutMs: number = 10000
): Promise<cheerio.CheerioAPI> {
  // タイムアウト設定
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'pochi-rss/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    return cheerio.load(html);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
