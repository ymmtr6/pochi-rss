/**
 * セレクタテストサービス
 * CSSセレクタの動作確認用
 */

import type { RSSItem } from '../config/types';
import { fetchAndLoadHtml, extractItems } from '../utils/scraper-helpers';

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
    // HTMLを取得してロード
    const $ = await fetchAndLoadHtml(request.url);

    // 記事アイテムを抽出（最大10件に制限）
    const items = extractItems($, request, request.url, { limit: 10 });

    return items;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Selector test failed: ${error.message}`);
    }
    throw new Error('Selector test failed: Unknown error');
  }
}
