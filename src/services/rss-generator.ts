/**
 * RSS生成サービス
 */

import type { RSSFeed } from '../config/types';

/**
 * RSS 2.0形式のXMLを生成
 */
export function generateRSS(feed: RSSFeed): string {
  const now = new Date().toUTCString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXml(feed.title)}</title>\n`;
  xml += `    <link>${escapeXml(feed.link)}</link>\n`;
  xml += `    <description>${escapeXml(feed.description)}</description>\n`;
  xml += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  xml += `    <atom:link href="${escapeXml(feed.link)}" rel="self" type="application/rss+xml"/>\n`;

  for (const item of feed.items) {
    xml += '    <item>\n';
    xml += `      <title>${escapeXml(item.title)}</title>\n`;
    xml += `      <link>${escapeXml(item.link)}</link>\n`;
    xml += `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>\n`;

    if (item.description) {
      xml += `      <description>${escapeXml(item.description)}</description>\n`;
    }

    if (item.pubDate) {
      // 日付が既にRFC 2822形式でない場合は変換を試みる
      const date = new Date(item.pubDate);
      const pubDate = isNaN(date.getTime()) ? item.pubDate : date.toUTCString();
      xml += `      <pubDate>${escapeXml(pubDate)}</pubDate>\n`;
    }

    if (item.author) {
      xml += `      <author>${escapeXml(item.author)}</author>\n`;
    }

    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';

  return xml;
}

/**
 * XML特殊文字をエスケープ
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
