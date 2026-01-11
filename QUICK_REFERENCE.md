# クイックリファレンス

## cacheTTL（キャッシュ生存時間）

| 用途 | TTL（秒） | 時間 | 例 |
|------|----------|------|-----|
| リアルタイムニュース | 300-600 | 5-10分 | 速報サイト |
| ニュースサイト | 1800 | 30分 | Hacker News |
| ブログ | 3600 | 1時間 | 技術ブログ |
| GitHub Trending | 7200 | 2時間 | トレンド情報 |
| 企業サイト | 21600 | 6時間 | お知らせページ |
| 低頻度更新 | 86400 | 24時間 | プレスリリース |

**計算式**: `秒 = 分 × 60` または `秒 = 時間 × 3600`

## CSSセレクタ早見表

### 基本

```css
element          /* タグ名: div, a, article */
.class           /* クラス: .post, .title */
#id              /* ID: #main, #content */
```

### 組み合わせ

```css
parent child     /* 子孫: article h2 */
parent > child   /* 直接の子: div > a */
element.class    /* 両方: div.post */
```

### よく使うパターン

```css
/* 記事一覧 */
article.post
div.news-item
li.article
tr.athing

/* タイトル */
h2.title
h2.entry-title > a
td.title > span > a

/* リンク */
a.permalink
h2 > a
div.link > a

/* 説明 */
p.summary
div.excerpt
p.description

/* 日付 */
time.published
span.date
time[datetime]

/* 著者 */
span.author
div.byline
a.author-name
```

## 最小構成

```json
{
  "id": "my-site",
  "name": "My Site",
  "url": "https://example.com",
  "cacheTTL": 3600,
  "selectors": {
    "items": "article",
    "title": "h2",
    "link": "a"
  },
  "feed": {
    "title": "My Site RSS",
    "description": "Latest posts",
    "link": "https://example.com"
  }
}
```

## フル構成

```json
{
  "id": "full-example",
  "name": "Full Example",
  "url": "https://example.com/blog",
  "cacheTTL": 3600,
  "selectors": {
    "items": "article.post",
    "title": "h2.title > a",
    "link": "h2.title > a",
    "description": "div.summary",
    "pubDate": "time.published",
    "author": "span.author"
  },
  "feed": {
    "title": "Blog RSS Feed",
    "description": "Latest blog posts",
    "link": "https://example.com/blog"
  }
}
```

## よくあるHTML構造

### パターン1: article要素

```html
<article class="post">
  <h2><a href="/post/1">Title</a></h2>
  <p class="summary">Description</p>
  <time>2026-01-10</time>
</article>
```

```json
{
  "items": "article.post",
  "title": "h2 a",
  "link": "h2 a",
  "description": "p.summary",
  "pubDate": "time"
}
```

### パターン2: div要素

```html
<div class="news-item">
  <h3 class="headline">Title</h3>
  <a href="/news/1" class="link">Read more</a>
  <p class="lead">Description</p>
</div>
```

```json
{
  "items": "div.news-item",
  "title": "h3.headline",
  "link": "a.link",
  "description": "p.lead"
}
```

### パターン3: リスト形式

```html
<ul class="articles">
  <li class="item">
    <a href="/article/1">Title</a>
    <span class="date">2026-01-10</span>
  </li>
</ul>
```

```json
{
  "items": "li.item",
  "title": "a",
  "link": "a",
  "pubDate": "span.date"
}
```

### パターン4: テーブル形式（Hacker News型）

```html
<table>
  <tr class="athing">
    <td class="title">
      <span><a href="...">Title</a></span>
    </td>
  </tr>
</table>
```

```json
{
  "items": "tr.athing",
  "title": "td.title > span > a",
  "link": "td.title > span > a"
}
```

## API操作

### 追加

```bash
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @config.json
```

### 更新（cacheTTLのみ）

```bash
curl -X PUT http://localhost:8787/api/sites/site-id \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"cacheTTL": 1800}'
```

### 更新（セレクタのみ）

```bash
curl -X PUT http://localhost:8787/api/sites/site-id \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "selectors": {
      "items": "new-selector",
      "title": "new-title",
      "link": "new-link"
    }
  }'
```

### 削除

```bash
curl -X DELETE http://localhost:8787/api/sites/site-id \
  -H "Authorization: Bearer test-api-key-12345"
```

### 取得

```bash
curl http://localhost:8787/feed/site-id
```

## トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 記事が0件 | セレクタ間違い | ブラウザコンソールでテスト |
| タイトルが空 | 子要素にテキスト | セレクタを調整（`h2 span`等） |
| リンクが変 | 相対URL | 自動変換されるので問題なし |
| 古い記事のまま | キャッシュ | TTL経過を待つか設定更新 |
| エラー502 | スクレイピング失敗 | セレクタとURLを確認 |

## デバッグ方法

```bash
# HTMLをダウンロード
curl https://example.com > page.html

# セレクタをブラウザでテスト
# ブラウザでpage.htmlを開き、コンソールで:
document.querySelectorAll('your-selector')

# フィード内の記事数確認
curl -s http://localhost:8787/feed/site-id | grep -c "<item>"

# RSSの内容確認（最初の50行）
curl -s http://localhost:8787/feed/site-id | head -50
```

## 便利なコマンド

```bash
# サイト一覧
curl http://localhost:8787/sites | jq

# 特定の設定を確認
curl http://localhost:8787/api/sites/site-id \
  -H "Authorization: Bearer test-api-key-12345" | jq

# フィードをファイルに保存
curl http://localhost:8787/feed/site-id > feed.xml

# ファイルから設定を追加
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @examples/hackernews.json
```
