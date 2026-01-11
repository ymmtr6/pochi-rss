/**
 * 日付パーサーユーティリティ
 * 日本語形式の日付文字列をパースしてISO形式に変換
 */

/**
 * 日本語日付文字列をパースしてISO形式の文字列を返す
 * パースできない場合はnullを返す
 */
export function parseJapaneseDate(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  const trimmed = dateStr.trim();

  // まず標準的なフォーマットでパースを試みる
  const standardDate = new Date(trimmed);
  if (!isNaN(standardDate.getTime())) {
    return standardDate.toISOString();
  }

  // 日本語パターンのマッチング
  // パターン1: YYYY年MM月DD日HH時MM分SS秒
  let match = trimmed.match(
    /(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2})時)?(?:\s*(\d{1,2})分)?(?:\s*(\d{1,2})秒)?/
  );
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 月は0-indexed
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;

    const date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // パターン2: MM月DD日HH時MM分SS秒（年なし、今年とみなす）
  match = trimmed.match(
    /(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2})時)?(?:\s*(\d{1,2})分)?(?:\s*(\d{1,2})秒)?/
  );
  if (match) {
    const year = new Date().getFullYear();
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const hour = match[3] ? parseInt(match[3], 10) : 0;
    const minute = match[4] ? parseInt(match[4], 10) : 0;
    const second = match[5] ? parseInt(match[5], 10) : 0;

    const date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // パターン3: YYYY/MM/DD HH:MM:SS
  match = trimmed.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;

    const date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // パターン4: YYYY.MM.DD HH:MM:SS
  match = trimmed.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;

    const date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // パースできなかった
  return null;
}
