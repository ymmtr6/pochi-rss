/**
 * Cloudflare Workers環境の型定義
 */

export interface Env {
  // KVネームスペース
  RSS_STORE: KVNamespace;

  // シークレット
  API_KEY: string;

  // Assets (管理画面の静的ファイル配信)
  ASSETS?: Fetcher;

  // Workers Sites
  __STATIC_CONTENT?: KVNamespace;
  __STATIC_CONTENT_MANIFEST?: string;
}
