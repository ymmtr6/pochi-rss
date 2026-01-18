/**
 * サイト設定管理サービスのテスト
 */

import { describe, it, expect } from 'vitest';
import {
  isValidUrl,
  isValidSelector,
  validateSiteConfig,
  validateSiteConfigDetailed,
} from './config-manager';
import type { SiteConfig } from '../config/types';

describe('isValidUrl', () => {
  it('有効なHTTP URLを受け入れる', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('有効なHTTPS URLを受け入れる', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('パスやクエリを含むURLを受け入れる', () => {
    expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
  });

  it('空文字列を拒否する', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('不正な形式を拒否する', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });

  it('ftp:// プロトコルを拒否する', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
  });

  it('javascript: プロトコルを拒否する', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('文字列以外の型を拒否する', () => {
    expect(isValidUrl(null as any)).toBe(false);
    expect(isValidUrl(undefined as any)).toBe(false);
    expect(isValidUrl(123 as any)).toBe(false);
  });
});

describe('isValidSelector', () => {
  it('有効なCSSセレクタを受け入れる', () => {
    expect(isValidSelector('.class')).toBe(true);
    expect(isValidSelector('#id')).toBe(true);
    expect(isValidSelector('div')).toBe(true);
    expect(isValidSelector('div.class')).toBe(true);
    expect(isValidSelector('div > p')).toBe(true);
  });

  it('空文字列を拒否する', () => {
    expect(isValidSelector('')).toBe(false);
  });

  it('文字列以外の型を拒否する', () => {
    expect(isValidSelector(null as any)).toBe(false);
    expect(isValidSelector(undefined as any)).toBe(false);
  });

  it('長すぎるセレクタを拒否する（ReDoS対策）', () => {
    const longSelector = 'div'.repeat(200);
    expect(isValidSelector(longSelector)).toBe(false);
  });

  it('不正なセレクタを拒否する', () => {
    expect(isValidSelector('>>>')).toBe(false);
    expect(isValidSelector('[[[')).toBe(false);
  });
});

describe('validateSiteConfigDetailed', () => {
  const validConfig: SiteConfig = {
    id: 'test-site',
    name: 'Test Site',
    url: 'https://example.com',
    cacheTTL: 3600,
    selectors: {
      items: '.article',
      title: '.title',
      link: 'a',
    },
    feed: {
      title: 'Test Feed',
      description: 'Test Description',
      link: 'https://example.com',
    },
  };

  describe('正常系', () => {
    it('有効な設定を受け入れる', () => {
      const result = validateSiteConfigDetailed(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('id検証', () => {
    it('空のidを拒否する', () => {
      const config = { ...validConfig, id: '' };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id is required and must be a non-empty string');
    });

    it('不正な文字を含むidを拒否する', () => {
      const config = { ...validConfig, id: 'test site!' };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'id must contain only alphanumeric characters, hyphens, and underscores'
      );
    });

    it('ハイフンとアンダースコアを含むidを受け入れる', () => {
      const config = { ...validConfig, id: 'test-site_123' };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('name検証', () => {
    it('空のnameを拒否する', () => {
      const config = { ...validConfig, name: '' };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name is required and must be a non-empty string');
    });
  });

  describe('url検証', () => {
    it('不正なURLを拒否する', () => {
      const config = { ...validConfig, url: 'not a url' };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('url must be a valid HTTP/HTTPS URL');
    });
  });

  describe('cacheTTL検証', () => {
    it('0以下のcacheTTLを拒否する', () => {
      const config = { ...validConfig, cacheTTL: 0 };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cacheTTL must be greater than 0');
    });

    it('24時間を超えるcacheTTLを拒否する', () => {
      const config = { ...validConfig, cacheTTL: 86401 };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cacheTTL must not exceed 86400 seconds (24 hours)');
    });

    it('数値以外のcacheTTLを拒否する', () => {
      const config = { ...validConfig, cacheTTL: '3600' as any };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cacheTTL is required and must be a number');
    });
  });

  describe('selectors検証', () => {
    it('必須セレクタが欠けている場合を拒否する', () => {
      const config = {
        ...validConfig,
        selectors: { items: '.article', title: '.title' },
      } as any;
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('selectors.link'))).toBe(true);
    });

    it('空のセレクタを拒否する', () => {
      const config = {
        ...validConfig,
        selectors: { ...validConfig.selectors, items: '' },
      };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('selectors.items must be a non-empty string');
    });

    it('不正なCSSセレクタを拒否する', () => {
      const config = {
        ...validConfig,
        selectors: { ...validConfig.selectors, items: '>>>' },
      };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('selectors.items is not a valid CSS selector');
    });
  });

  describe('feed検証', () => {
    it('必須フィールドが欠けている場合を拒否する', () => {
      const config = {
        ...validConfig,
        feed: { title: 'Test', description: 'Test' },
      } as any;
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('feed.link'))).toBe(true);
    });

    it('空のフィールドを拒否する', () => {
      const config = {
        ...validConfig,
        feed: { ...validConfig.feed, title: '' },
      };
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('feed.title is required and must be a non-empty string');
    });
  });

  describe('複数のエラー', () => {
    it('複数のエラーを全て報告する', () => {
      const config = {
        id: '',
        name: '',
        url: 'invalid',
        cacheTTL: -1,
      } as any;
      const result = validateSiteConfigDetailed(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

describe('validateSiteConfig', () => {
  const validConfig: SiteConfig = {
    id: 'test-site',
    name: 'Test Site',
    url: 'https://example.com',
    cacheTTL: 3600,
    selectors: {
      items: '.article',
      title: '.title',
      link: 'a',
    },
    feed: {
      title: 'Test Feed',
      description: 'Test Description',
      link: 'https://example.com',
    },
  };

  it('有効な設定でtrueを返す', () => {
    expect(validateSiteConfig(validConfig)).toBe(true);
  });

  it('無効な設定でfalseを返す', () => {
    const config = { ...validConfig, url: 'invalid' };
    expect(validateSiteConfig(config)).toBe(false);
  });
});
