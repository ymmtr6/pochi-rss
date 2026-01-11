/**
 * セレクタテストサービス
 * CSSセレクタの動作確認用
 */

import * as cheerio from 'cheerio';
import type { RSSItem } from '../config/types';
import { parseJapaneseDate } from '../utils/date-parser';

export interface SelectorTestRequest {
  url: string;
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
 * セレクタをテストしてデータ抽出を実行
 * スクレイパーのロジックを再利用
 */
export async function testSelectors(
  request: SelectorTestRequest
): Promise<RSSItem[]> {
  try {
    // タイムアウト設定（10秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(request.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'pochi-rss/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${request.url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items: RSSItem[] = [];

    // 記事一覧を取得（最大10件に制限）
    $(request.selectors.items)
      .slice(0, 10)
      .each((_, element) => {
        const $item = $(element);

        // タイトルを取得
        const title = $item.find(request.selectors.title).text().trim();

        // リンクを取得
        let link = $item.find(request.selectors.link).attr('href') || '';

        // linkが見つからない場合、item自体がリンク要素かチェック
        if (!link) {
          link = $item.attr('href') || '';
        }

        // 相対URLを絶対URLに変換
        if (link && !link.startsWith('http')) {
          const baseUrl = new URL(request.url);
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
        if (request.selectors.description) {
          const desc = $item
            .find(request.selectors.description)
            .text()
            .trim();
          if (desc) {
            description = desc;
          }
        }

        // 公開日（必須、フォールバック処理あり）
        let pubDate: string | undefined;
        if (request.selectors.pubDate) {
          const extracted = $item
            .find(request.selectors.pubDate)
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

        // pubDateが取れなかった場合は現在時刻を使用（テスト用）
        if (!pubDate) {
          pubDate = new Date().toISOString();
        }

        // 著者（オプション）
        let author: string | undefined;
        if (request.selectors.author) {
          const auth = $item
            .find(request.selectors.author)
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
      throw new Error(`Selector test failed: ${error.message}`);
    }
    throw new Error('Selector test failed: Unknown error');
  }
}
