/**
 * Cloudflare Workers環境の型定義
 */

export interface Env {
  // KVネームスペース
  RSS_STORE: KVNamespace;

  // シークレット
  API_KEY: string;
}
