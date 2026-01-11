/**
 * サイト設定の型定義
 */

export interface SiteConfig {
  /** サイト識別子（URLパスに使用） */
  id: string;

  /** サイト名 */
  name: string;

  /** スクレイピング対象URL */
  url: string;

  /** RSSキャッシュの有効期間（秒） */
  cacheTTL: number;

  /** CSSセレクタ設定 */
  selectors: {
    /** 記事一覧を取得するセレクタ */
    items: string;

    /** タイトルを取得するセレクタ（itemsからの相対） */
    title: string;

    /** リンクを取得するセレクタ（itemsからの相対） */
    link: string;

    /** 説明を取得するセレクタ（itemsからの相対、オプション） */
    description?: string;

    /** 公開日を取得するセレクタ（itemsからの相対、オプション） */
    pubDate?: string;

    /** 著者を取得するセレクタ（itemsからの相対、オプション） */
    author?: string;
  };

  /** RSSフィードのメタ情報 */
  feed: {
    /** RSSフィードのタイトル */
    title: string;

    /** RSSフィードの説明 */
    description: string;

    /** RSSフィードのリンク */
    link: string;
  };
}

/**
 * RSS記事アイテム
 */
export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  author?: string;
}

/**
 * RSSフィード
 */
export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}
