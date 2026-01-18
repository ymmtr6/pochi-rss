/**
 * サイト設定管理サービス
 * KVストアとのやりとりを管理
 */

import * as cheerio from 'cheerio';
import type { SiteConfig } from '../config/types';

/**
 * URLの形式を検証
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * CSSセレクタの有効性を検証
 */
export function isValidSelector(selector: string): boolean {
  if (typeof selector !== 'string' || selector.length === 0) {
    return false;
  }

  // 長すぎるセレクタを拒否（ReDoS対策）
  if (selector.length > 500) {
    return false;
  }

  try {
    const $ = cheerio.load('<div></div>');
    $(selector);
    return true;
  } catch {
    return false;
  }
}

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
 * 新しいバリデータ関数を使用
 */
export function validateSiteConfig(config: any): config is SiteConfig {
  const result = validateSiteConfigDetailed(config);
  return result.valid;
}

/**
 * サイト設定の詳細なバリデーション
 * エラーメッセージを含む結果を返す
 */
export function validateSiteConfigDetailed(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 基本型チェック
  if (typeof config !== 'object' || config === null) {
    errors.push('config must be an object');
    return { valid: false, errors };
  }

  // idの検証
  if (typeof config.id !== 'string' || config.id.length === 0) {
    errors.push('id is required and must be a non-empty string');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(config.id)) {
    errors.push('id must contain only alphanumeric characters, hyphens, and underscores');
  }

  // nameの検証
  if (typeof config.name !== 'string' || config.name.length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  // urlの検証
  if (typeof config.url !== 'string' || config.url.length === 0) {
    errors.push('url is required and must be a non-empty string');
  } else if (!isValidUrl(config.url)) {
    errors.push('url must be a valid HTTP/HTTPS URL');
  }

  // cacheTTLの検証
  if (typeof config.cacheTTL !== 'number') {
    errors.push('cacheTTL is required and must be a number');
  } else if (config.cacheTTL <= 0) {
    errors.push('cacheTTL must be greater than 0');
  } else if (config.cacheTTL > 86400) {
    errors.push('cacheTTL must not exceed 86400 seconds (24 hours)');
  }

  // セレクタの検証
  if (typeof config.selectors !== 'object' || config.selectors === null) {
    errors.push('selectors must be an object');
  } else {
    const required = ['items', 'title', 'link'];
    for (const field of required) {
      if (typeof config.selectors[field] !== 'string') {
        errors.push(`selectors.${field} is required and must be a string`);
      } else if (config.selectors[field].length === 0) {
        errors.push(`selectors.${field} must be a non-empty string`);
      } else if (!isValidSelector(config.selectors[field])) {
        errors.push(`selectors.${field} is not a valid CSS selector`);
      }
    }
  }

  // フィード設定の検証
  if (typeof config.feed !== 'object' || config.feed === null) {
    errors.push('feed must be an object');
  } else {
    const required = ['title', 'description', 'link'];
    for (const field of required) {
      if (typeof config.feed[field] !== 'string' || config.feed[field].length === 0) {
        errors.push(`feed.${field} is required and must be a non-empty string`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
