# 設定ガイド

## RSSキャッシュの生存時間（TTL）

### 概要

`cacheTTL`は、生成されたRSSフィードをKVストアにキャッシュする時間を**秒単位**で指定します。

### 設定方法

```json
{
  "cacheTTL": 3600
}
```

### 推奨値

| 更新頻度 | cacheTTL | 説明 |
|---------|----------|------|
| リアルタイム | 300-600秒 | 5-10分。ニュースサイトなど頻繁に更新されるサイト |
| 高頻度 | 1800-3600秒 | 30分-1時間。ブログやフォーラムなど |
| 中頻度 | 7200-21600秒 | 2-6時間。技術ブログ、企業サイトなど |
| 低頻度 | 43200-86400秒 | 12-24時間。あまり更新されないサイト |

### 仕組み

1. **初回アクセス**: キャッシュがないため、スクレイピングを実行してRSSを生成
2. **TTL期間中**: キャッシュからRSSを返却（高速）
3. **TTL期限切れ後**: 再度スクレイピングを実行し、新しいRSSを生成・キャッシュ

### 注意点

- **短すぎる場合**: 対象サイトへの負荷が増加し、アクセス制限される可能性
- **長すぎる場合**: 新しい記事が反映されるまで時間がかかる
- **最適値**: 対象サイトの更新頻度とアクセス数のバランスを考慮

### 動的な変更

設定後でもAPIで変更可能です：

```bash
curl -X PUT http://localhost:8787/api/sites/example \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cacheTTL": 1800
  }'
```

変更後、既存のキャッシュは自動的に削除され、次回アクセス時に新しいTTLで再キャッシュされます。

---

## スクレイピングの指定方法

### CSSセレクタの基本

スクレイピングは**CSSセレクタ**を使用してHTML要素を指定します。ブラウザの開発者ツールと同じ記法です。

### 必須セレクタ

#### 1. `items` - 記事一覧のセレクタ

個別の記事を表すHTML要素を指定します。

```json
{
  "selectors": {
    "items": "article.post"
  }
}
```

**例:**
```html
<!-- これを取得 -->
<article class="post">...</article>
<article class="post">...</article>
<article class="post">...</article>
```

#### 2. `title` - タイトルのセレクタ

**items内の各要素からの相対パス**でタイトルを取得します。

```json
{
  "selectors": {
    "items": "article.post",
    "title": "h2.post-title"
  }
}
```

**例:**
```html
<article class="post">
  <h2 class="post-title">記事タイトル</h2>  <!-- これを取得 -->
</article>
```

#### 3. `link` - リンクのセレクタ

記事へのリンク（`href`属性）を取得します。

```json
{
  "selectors": {
    "items": "article.post",
    "link": "h2.post-title > a"
  }
}
```

**例:**
```html
<article class="post">
  <h2 class="post-title">
    <a href="/article/123">記事タイトル</a>  <!-- このhrefを取得 -->
  </h2>
</article>
```

### オプションセレクタ

#### 4. `description` - 説明文（オプション）

記事の概要や抜粋を取得します。

```json
{
  "selectors": {
    "description": "p.summary"
  }
}
```

#### 5. `pubDate` - 公開日（オプション）

記事の公開日時を取得します。

```json
{
  "selectors": {
    "pubDate": "time.published"
  }
}
```

**対応形式:**
- ISO 8601: `2026-01-10T12:00:00Z`
- 日本語: `2026年1月10日`
- その他: 自動的にパース、失敗時は元の文字列を使用

#### 6. `author` - 著者名（オプション）

記事の著者名を取得します。

```json
{
  "selectors": {
    "author": "span.author-name"
  }
}
```

---

## セレクタの調べ方

### 方法1: ブラウザの開発者ツール

1. 対象サイトをブラウザで開く
2. 右クリック → 「検証」または F12
3. 記事要素にカーソルを合わせる
4. 右クリック → 「Copy」 → 「Copy selector」

### 方法2: コンソールでテスト

ブラウザのコンソールで直接テスト：

```javascript
// 記事一覧を確認
document.querySelectorAll('article.post')

// タイトルを確認
document.querySelectorAll('article.post h2')

// リンクを確認
document.querySelectorAll('article.post a')
```

### 方法3: curlでHTMLをダウンロード

```bash
curl https://example.com/blog > page.html
```

HTMLファイルをエディタで開いて構造を確認します。

---

## 実践例

### 例1: 一般的なブログ

```json
{
  "id": "tech-blog",
  "name": "Tech Blog",
  "url": "https://example.com/blog",
  "cacheTTL": 3600,
  "selectors": {
    "items": "article.blog-post",
    "title": "h2.entry-title",
    "link": "h2.entry-title > a",
    "description": "div.entry-summary",
    "pubDate": "time.published",
    "author": "span.author"
  },
  "feed": {
    "title": "Tech Blog RSS",
    "description": "Latest articles from Tech Blog",
    "link": "https://example.com/blog"
  }
}
```

### 例2: ニュースサイト

```json
{
  "id": "news-site",
  "name": "News Site",
  "url": "https://news.example.com/",
  "cacheTTL": 600,
  "selectors": {
    "items": "div.news-item",
    "title": "h3.headline",
    "link": "a.news-link",
    "description": "p.lead",
    "pubDate": "span.timestamp"
  },
  "feed": {
    "title": "News Site Headlines",
    "description": "Latest news headlines",
    "link": "https://news.example.com/"
  }
}
```

### 例3: シンプルなリスト

```json
{
  "id": "simple-list",
  "name": "Simple Article List",
  "url": "https://example.com/articles",
  "cacheTTL": 7200,
  "selectors": {
    "items": "li.article",
    "title": "a",
    "link": "a"
  },
  "feed": {
    "title": "Article List",
    "description": "Simple article list",
    "link": "https://example.com/articles"
  }
}
```

**HTML構造:**
```html
<ul>
  <li class="article">
    <a href="/article/1">Article Title 1</a>
  </li>
  <li class="article">
    <a href="/article/2">Article Title 2</a>
  </li>
</ul>
```

---

## CSSセレクタのチートシート

| セレクタ | 説明 | 例 |
|---------|------|-----|
| `element` | タグ名 | `div`, `a`, `article` |
| `.class` | クラス名 | `.post`, `.title` |
| `#id` | ID | `#main`, `#header` |
| `parent child` | 子孫要素 | `article h2` |
| `parent > child` | 直接の子要素 | `div > a` |
| `[attr]` | 属性を持つ | `[href]` |
| `[attr="value"]` | 属性値が一致 | `[class="post"]` |
| `element:first-child` | 最初の子要素 | `li:first-child` |
| `element:nth-child(n)` | n番目の子要素 | `tr:nth-child(2)` |

### 複雑なセレクタの例

```css
/* クラスが"post"で、かつ"featured"のdiv */
div.post.featured

/* article内のh2の中のa要素 */
article h2 a

/* data-type属性が"news"の要素 */
[data-type="news"]

/* 複数のクラスを持つ要素 */
div.article.premium.new
```

---

## トラブルシューティング

### 記事が取得できない

**原因1: セレクタが間違っている**
- ブラウザのコンソールで `document.querySelectorAll('your-selector')` をテスト
- 要素が取得できるか確認

**原因2: JavaScriptで動的に生成されている**
- pochi-rssは静的なHTMLのみ対応
- JavaScript実行後のコンテンツは取得不可
- curlでHTMLをダウンロードして、目的の要素が含まれているか確認

**原因3: 相対パスが正しくない**
- `items`からの相対パスになっているか確認
- 絶対パスではなく、各itemからの相対パスを指定

### リンクがおかしい

**原因: 相対URLの場合**
- pochi-rssは自動的に絶対URLに変換します
- `/article/123` → `https://example.com/article/123`

### タイトルが空になる

**原因: テキストが子要素にある**
```html
<h2 class="title">
  <span>実際のタイトル</span>
</h2>
```

**解決策:**
```json
{
  "title": "h2.title span"
}
```

---

## 設定の検証

設定を追加した後、すぐにテストできます：

```bash
# 設定追加
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @config.json

# すぐにフィード取得してテスト
curl http://localhost:8787/feed/your-site-id

# 記事数を確認
curl -s http://localhost:8787/feed/your-site-id | grep -c "<item>"
```

問題があれば、設定を修正して再度テストできます：

```bash
# 設定更新
curl -X PUT http://localhost:8787/api/sites/your-site-id \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "selectors": {
      "items": "new-selector",
      "title": "new-title-selector",
      "link": "new-link-selector"
    }
  }'
```
