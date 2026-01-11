# サイト設定追加ガイド

## 概要

このガイドでは、pochi-rssに新しいサイトを追加する方法を説明します。

---

## 🚀 クイックスタート（最短3ステップ）

### 既存のサンプルを使う場合

```bash
# サンプルファイルをそのまま追加
./manage-site.sh
# → 1を選択（JSONファイルから追加）
# → examples/hackernews.json を指定
```

### 新しいサイトを追加する場合

```bash
# 1. セレクタをテスト
./test-selector.sh
# → 対象URLを入力
# → ブラウザで開いてセレクタを確認

# 2. サイト設定を追加
./manage-site.sh
# → 2を選択（対話的に入力）
# → 質問に答えていく
```

---

## 📋 詳細手順

### ステップ1: セレクタの調査

対象サイトからどのようにデータを抽出するかを決めます。

#### 方法A: test-selector.sh を使う（推奨）

```bash
./test-selector.sh
```

1. テストしたいサイトのURLを入力
2. ブラウザでテストページが開く
3. セレクタを入力して「テスト実行」
4. マッチした要素が表示される
5. うまくいったセレクタをメモ

**メリット:**
- リアルタイムでセレクタをテスト
- マッチした要素の内容を確認
- タイトルやリンクのセレクタも簡単にテスト

#### 方法B: ブラウザの開発者ツールを使う

1. 対象サイトをブラウザで開く
2. F12で開発者ツールを開く
3. Elements タブで記事要素を選択
4. 右クリック → Copy → Copy selector
5. コンソールで確認:
   ```javascript
   document.querySelectorAll('あなたのセレクタ')
   ```

#### 方法C: HTMLをダウンロードして確認

```bash
curl https://example.com/blog > page.html
# page.htmlをエディタで開いてセレクタを考える
```

### ステップ2: サイト設定の追加

#### manage-site.sh を使う（推奨）

```bash
./manage-site.sh
```

**環境選択:**
- ローカル環境（テスト用）: 1
- プロダクション環境: 2

**追加方法:**
- JSONファイルから: 1
- 対話的に入力: 2

**対話モードの入力例:**

```
サイトID: my-tech-blog
サイト名: My Tech Blog
URL: https://example.com/blog
キャッシュTTL: 3600 ← 1時間

記事一覧セレクタ: article.blog-post
タイトルセレクタ: h2.title a
リンクセレクタ: h2.title a
説明セレクタ: div.excerpt
公開日セレクタ: time.published
著者セレクタ: span.author

フィードタイトル: My Tech Blog RSS
フィード説明: Latest tech articles
フィードリンク: https://example.com/blog
```

#### 手動でJSONファイルを作成

```bash
# 1. examples/をコピー
cp examples/blog-example.json my-site.json

# 2. エディタで編集
nano my-site.json

# 3. curlで追加（ローカル）
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @my-site.json

# または本番環境
curl -X POST https://your-worker.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d @my-site.json
```

### ステップ3: 動作確認

```bash
# RSSフィードを取得
curl http://localhost:8787/feed/my-tech-blog

# または
curl https://your-worker.workers.dev/feed/my-tech-blog

# 記事数を確認
curl -s http://localhost:8787/feed/my-tech-blog | grep -c "<item>"
```

---

## 💡 セレクタのコツ

### 基本パターン

```css
/* タグ名 */
article
div
li

/* クラス */
.post
.article
.news-item

/* 組み合わせ */
article.post
div.news-item
li.article

/* 子要素 */
article h2           /* 子孫要素 */
article > h2         /* 直接の子要素 */
h2 a                 /* h2内のa要素 */
```

### よくあるパターン

#### パターン1: ブログ記事

```html
<article class="post">
  <h2 class="title"><a href="/post/1">Title</a></h2>
  <div class="excerpt">Summary...</div>
  <time>2026-01-10</time>
</article>
```

```json
{
  "items": "article.post",
  "title": "h2.title a",
  "link": "h2.title a",
  "description": "div.excerpt",
  "pubDate": "time"
}
```

#### パターン2: リスト形式

```html
<ul class="articles">
  <li class="item">
    <a href="/1">Title</a>
    <p>Description</p>
  </li>
</ul>
```

```json
{
  "items": "li.item",
  "title": "a",
  "link": "a",
  "description": "p"
}
```

#### パターン3: テーブル（Hacker News型）

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
  "title": "td.title span a",
  "link": "td.title span a"
}
```

---

## 🔧 トラブルシューティング

### 記事が0件になる

**原因:** セレクタが間違っている

**解決策:**
1. `test-selector.sh` でセレクタを確認
2. ブラウザコンソールで `document.querySelectorAll('セレクタ')` をテスト
3. HTMLをダウンロードして構造を確認: `curl URL > page.html`

### タイトルが空になる

**原因:** タイトルが子要素にある

```html
<!-- × タイトルがspan内にある -->
<h2 class="title">
  <span>実際のタイトル</span>
</h2>
```

**解決策:** セレクタを調整
```json
{
  "title": "h2.title span"
}
```

### リンクが相対URLになる

**問題なし:** pochi-rssが自動的に絶対URLに変換します

```
/article/123 → https://example.com/article/123
```

### JavaScriptで生成されるコンテンツ

**残念ながら非対応:** pochi-rssは静的なHTMLのみ対応

確認方法:
```bash
curl https://example.com > page.html
# page.htmlに目的の要素があるか確認
```

なければ、そのサイトはJavaScriptで動的に生成している可能性が高いです。

---

## 📊 cacheTTLの設定目安

| サイトの更新頻度 | cacheTTL（秒） | 時間 |
|----------------|---------------|------|
| リアルタイム更新 | 300-600 | 5-10分 |
| 高頻度（ニュース） | 1800 | 30分 |
| 中頻度（ブログ） | 3600 | 1時間 |
| 低頻度（技術ブログ） | 7200-21600 | 2-6時間 |
| 稀（プレスリリース） | 86400 | 24時間 |

**計算:**
- 秒 = 分 × 60
- 秒 = 時間 × 3600

**例:**
- 30分 = 1800秒
- 1時間 = 3600秒
- 2時間 = 7200秒

---

## 📝 設定の更新と削除

### 設定を更新

```bash
curl -X PUT http://localhost:8787/api/sites/my-site \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "cacheTTL": 1800,
    "selectors": {
      "items": "new-selector",
      "title": "new-title",
      "link": "new-link"
    }
  }'
```

### 設定を削除

```bash
curl -X DELETE http://localhost:8787/api/sites/my-site \
  -H "Authorization: Bearer test-api-key-12345"
```

### 設定を確認

```bash
curl http://localhost:8787/api/sites/my-site \
  -H "Authorization: Bearer test-api-key-12345"
```

---

## 🎯 ベストプラクティス

### 1. まずローカルでテスト

```bash
# ローカルサーバー起動
npm run dev

# ローカルに追加してテスト
./manage-site.sh
# → 1 (ローカル) を選択

# うまくいったら本番に追加
./manage-site.sh
# → 2 (プロダクション) を選択
```

### 2. セレクタはシンプルに

```css
/* 良い例 */
article.post
h2.title

/* 悪い例（複雑すぎ） */
body > div.container > main > section > article.post:nth-child(1)
```

### 3. cacheTTLは控えめに

最初は長めに設定（3600秒 = 1時間）して、様子を見て調整。

### 4. 設定をバックアップ

```bash
# 設定をファイルに保存
curl http://localhost:8787/api/sites/my-site \
  -H "Authorization: Bearer test-api-key-12345" \
  > backup/my-site.json
```

---

## 🔗 関連ドキュメント

- [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) - 詳細な設定ガイド
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - クイックリファレンス
- [examples/](./examples/) - サンプル設定

---

## 💬 よくある質問

**Q: 複数のサイトを一度に追加できますか？**

A: スクリプトは1つずつですが、JSONファイルを複数用意してループで追加できます：

```bash
for file in my-configs/*.json; do
  ./manage-site.sh
  # JSONファイルから追加を選択
done
```

**Q: セレクタが正しいか不安です**

A: `test-selector.sh` で必ず確認してください。ブラウザで視覚的に確認できるので安心です。

**Q: 途中で設定を変更できますか？**

A: はい。PUT APIで部分的に更新できます。キャッシュも自動的にクリアされます。

---

これで新しいサイトの追加は完璧です！
