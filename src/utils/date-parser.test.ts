/**
 * 日付パーサーユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';
import { parseJapaneseDate } from './date-parser';

describe('parseJapaneseDate', () => {
  describe('標準的なISO形式', () => {
    it('ISO 8601形式の日付をパースできる', () => {
      const result = parseJapaneseDate('2024-01-15T10:30:00.000Z');
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('標準的な日付文字列をパースできる', () => {
      const result = parseJapaneseDate('2024-01-15');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01-15');
    });
  });

  describe('日本語形式（年月日時分秒）', () => {
    it('完全な日本語形式をパースできる', () => {
      const result = parseJapaneseDate('2024年1月15日 10時30分45秒');
      expect(result).not.toBeNull();
      // JSTとして解釈されるため、年月日のみチェック
      expect(result).toContain('2024-01');
    });

    it('時分秒なしの日本語形式をパースできる', () => {
      const result = parseJapaneseDate('2024年1月15日');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01');
    });

    it('時分のみの日本語形式をパースできる', () => {
      const result = parseJapaneseDate('2024年1月15日 10時30分');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01');
    });

    it('年なしの日本語形式をパースできる', () => {
      const currentYear = new Date().getFullYear();
      const result = parseJapaneseDate('1月15日 10時30分');
      expect(result).not.toBeNull();
      expect(result).toContain(currentYear.toString());
    });
  });

  describe('スラッシュ区切り形式', () => {
    it('YYYY/MM/DD形式をパースできる', () => {
      const result = parseJapaneseDate('2024/01/15');
      expect(result).not.toBeNull();
      // JSTとして解釈されUTCに変換されるため、年月のみチェック
      expect(result).toContain('2024-01');
    });

    it('YYYY/MM/DD HH:MM:SS形式をパースできる', () => {
      const result = parseJapaneseDate('2024/01/15 10:30:45');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01-15');
    });

    it('YYYY/M/D形式（ゼロ埋めなし）をパースできる', () => {
      const result = parseJapaneseDate('2024/1/5');
      expect(result).not.toBeNull();
      // JSTとして解釈されUTCに変換されるため、年月のみチェック
      expect(result).toContain('2024-01');
    });
  });

  describe('ドット区切り形式', () => {
    it('YYYY.MM.DD形式をパースできる', () => {
      const result = parseJapaneseDate('2024.01.15');
      expect(result).not.toBeNull();
      // JSTとして解釈されUTCに変換されるため、年月のみチェック
      expect(result).toContain('2024-01');
    });

    it('YYYY.MM.DD HH:MM:SS形式をパースできる', () => {
      const result = parseJapaneseDate('2024.01.15 10:30:45');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01-15');
    });
  });

  describe('エッジケース', () => {
    it('空文字列の場合はnullを返す', () => {
      const result = parseJapaneseDate('');
      expect(result).toBeNull();
    });

    it('不正な形式の場合はnullを返す', () => {
      const result = parseJapaneseDate('invalid date');
      expect(result).toBeNull();
    });

    it('前後に空白がある場合でもパースできる', () => {
      const result = parseJapaneseDate('  2024年1月15日  ');
      expect(result).not.toBeNull();
      expect(result).toContain('2024-01');
    });

    it('null入力の場合はnullを返す', () => {
      const result = parseJapaneseDate(null as any);
      expect(result).toBeNull();
    });

    it('undefined入力の場合はnullを返す', () => {
      const result = parseJapaneseDate(undefined as any);
      expect(result).toBeNull();
    });
  });
});
