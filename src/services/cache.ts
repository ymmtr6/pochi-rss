/**
 * RSSキャッシュ管理サービス
 */

const CACHE_PREFIX = 'rss:cache:';

/**
 * RSSキャッシュを取得
 */
export async function getRSSCache(
  kv: KVNamespace,
  siteId: string
): Promise<string | null> {
  const key = `${CACHE_PREFIX}${siteId}`;
  return await kv.get(key);
}

/**
 * RSSキャッシュを保存
 */
export async function setRSSCache(
  kv: KVNamespace,
  siteId: string,
  rssXml: string,
  ttl: number
): Promise<void> {
  const key = `${CACHE_PREFIX}${siteId}`;
  await kv.put(key, rssXml, {
    expirationTtl: ttl,
  });
}

/**
 * RSSキャッシュを削除
 */
export async function deleteRSSCache(
  kv: KVNamespace,
  siteId: string
): Promise<void> {
  const key = `${CACHE_PREFIX}${siteId}`;
  await kv.delete(key);
}
