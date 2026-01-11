# ローカル動作確認手順

## 1. 開発サーバーの起動

```bash
npm run dev
```

起動すると、`http://localhost:8787` でサーバーが立ち上がります。

## 2. サービス情報の確認

```bash
curl http://localhost:8787/
```

## 3. テスト用サイト設定の追加

### 例1: Hacker News（実際のサイト）

```bash
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hackernews",
    "name": "Hacker News Front Page",
    "url": "https://news.ycombinator.com/",
    "cacheTTL": 3600,
    "selectors": {
      "items": "tr.athing",
      "title": "td.title > span > a",
      "link": "td.title > span > a",
      "description": "td.title > span.titleline"
    },
    "feed": {
      "title": "Hacker News",
      "description": "Hacker News front page stories",
      "link": "https://news.ycombinator.com/"
    }
  }'
```

### 例2: GitHub Trending（実際のサイト）

```bash
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github-trending",
    "name": "GitHub Trending Repositories",
    "url": "https://github.com/trending",
    "cacheTTL": 7200,
    "selectors": {
      "items": "article.Box-row",
      "title": "h2 a",
      "link": "h2 a",
      "description": "p.col-9"
    },
    "feed": {
      "title": "GitHub Trending",
      "description": "Trending repositories on GitHub",
      "link": "https://github.com/trending"
    }
  }'
```

## 4. サイト一覧の確認

```bash
curl http://localhost:8787/sites
```

## 5. RSSフィードの取得

### Hacker Newsのフィード取得

```bash
curl http://localhost:8787/feed/hackernews
```

XMLが返ってくることを確認してください。

### GitHub Trendingのフィード取得

```bash
curl http://localhost:8787/feed/github-trending
```

## 6. 設定の更新

```bash
curl -X PUT http://localhost:8787/api/sites/hackernews \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "cacheTTL": 1800
  }'
```

## 7. 設定の削除

```bash
curl -X DELETE http://localhost:8787/api/sites/hackernews \
  -H "Authorization: Bearer test-api-key-12345"
```

## ブラウザで確認

ブラウザで以下のURLにアクセスして、RSSフィードをXMLとして確認できます：

- http://localhost:8787/feed/hackernews
- http://localhost:8787/feed/github-trending

## トラブルシューティング

### スクレイピングが失敗する場合

1. 対象サイトのHTML構造を確認
2. セレクタが正しいか確認
3. タイムアウト（10秒）以内に応答があるか確認

### 認証エラーが出る場合

`.dev.vars` ファイルが存在し、`API_KEY=test-api-key-12345` が設定されているか確認してください。

### KVエラーが出る場合

ローカル開発時はWranglerが自動的にローカルKVストアを使用するため、特別な設定は不要です。

## セレクタのデバッグ方法

対象サイトのHTMLを確認するには：

```bash
curl https://news.ycombinator.com/ > test.html
```

ブラウザの開発者ツールでセレクタをテストできます：

```javascript
// ブラウザのコンソールで
document.querySelectorAll('tr.athing')
```

## 実際のRSSリーダーでテスト

ローカルサーバーを起動したまま、RSSリーダーアプリ（Feedly、NetNewsWireなど）で以下のURLを購読してみてください：

- http://localhost:8787/feed/hackernews
