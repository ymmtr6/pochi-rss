/**
 * RSSキャッシュ管理サービス
 */

import type { RSSItem } from '../config/types';

const CACHE_PREFIX = 'rss:cache:';
const ITEMS_CACHE_PREFIX = 'rss:items:';

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

/**
 * RSSアイテムキャッシュを取得
 */
export async function getRSSItemsCache(
  kv: KVNamespace,
  siteId: string
): Promise<RSSItem[] | null> {
  const key = `${ITEMS_CACHE_PREFIX}${siteId}`;
  const data = await kv.get(key);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as RSSItem[];
  } catch {
    return null;
  }
}

/**
 * RSSアイテムキャッシュを保存
 */
export async function setRSSItemsCache(
  kv: KVNamespace,
  siteId: string,
  items: RSSItem[],
  ttl: number
): Promise<void> {
  const key = `${ITEMS_CACHE_PREFIX}${siteId}`;
  await kv.put(key, JSON.stringify(items), {
    expirationTtl: ttl,
  });
}

/**
 * RSSアイテムキャッシュを削除
 */
export async function deleteRSSItemsCache(
  kv: KVNamespace,
  siteId: string
): Promise<void> {
  const key = `${ITEMS_CACHE_PREFIX}${siteId}`;
  await kv.delete(key);
}
