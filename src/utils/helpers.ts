/**
 * ユーティリティ関数
 */

/**
 * 相対URLを絶対URLに変換
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }

  const base = new URL(baseUrl);

  if (relativeUrl.startsWith('/')) {
    return `${base.origin}${relativeUrl}`;
  }

  return `${base.origin}/${relativeUrl}`;
}

/**
 * 日付文字列をRFC 2822形式に変換
 */
export function formatDateForRSS(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return date.toUTCString();
}
