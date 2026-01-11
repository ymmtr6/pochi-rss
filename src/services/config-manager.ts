/**
 * サイト設定管理サービス
 * KVストアとのやりとりを管理
 */

import type { SiteConfig } from '../config/types';

const CONFIG_PREFIX = 'config:site:';

/**
 * サイト設定を取得
 */
export async function getSiteConfig(
  kv: KVNamespace,
  siteId: string
): Promise<SiteConfig | null> {
  const key = `${CONFIG_PREFIX}${siteId}`;
  const config = await kv.get(key, 'json');
  return config as SiteConfig | null;
}

/**
 * すべてのサイト設定を取得
 */
export async function getAllSiteConfigs(
  kv: KVNamespace
): Promise<SiteConfig[]> {
  const list = await kv.list({ prefix: CONFIG_PREFIX });
  const configs: SiteConfig[] = [];

  for (const key of list.keys) {
    const config = await kv.get(key.name, 'json');
    if (config) {
      configs.push(config as SiteConfig);
    }
  }

  return configs;
}

/**
 * サイト設定を保存
 */
export async function saveSiteConfig(
  kv: KVNamespace,
  config: SiteConfig
): Promise<void> {
  const key = `${CONFIG_PREFIX}${config.id}`;
  await kv.put(key, JSON.stringify(config));
}

/**
 * サイト設定を削除
 */
export async function deleteSiteConfig(
  kv: KVNamespace,
  siteId: string
): Promise<void> {
  const key = `${CONFIG_PREFIX}${siteId}`;
  await kv.delete(key);
}

/**
 * サイト設定のバリデーション
 */
export function validateSiteConfig(config: any): config is SiteConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.id === 'string' &&
    config.id.length > 0 &&
    typeof config.name === 'string' &&
    config.name.length > 0 &&
    typeof config.url === 'string' &&
    config.url.length > 0 &&
    typeof config.cacheTTL === 'number' &&
    config.cacheTTL > 0 &&
    typeof config.selectors === 'object' &&
    config.selectors !== null &&
    typeof config.selectors.items === 'string' &&
    typeof config.selectors.title === 'string' &&
    typeof config.selectors.link === 'string' &&
    typeof config.feed === 'object' &&
    config.feed !== null &&
    typeof config.feed.title === 'string' &&
    typeof config.feed.description === 'string' &&
    typeof config.feed.link === 'string'
  );
}
