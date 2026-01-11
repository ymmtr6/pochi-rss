# サンプル設定

このディレクトリには、pochi-rssで使用できるサイト設定のサンプルが含まれています。

## 使い方

### 1. ローカル環境でテスト

```bash
# 開発サーバーを起動
npm run dev

# サンプル設定を追加
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @examples/hackernews.json

# RSSフィードを取得
curl http://localhost:8787/feed/hackernews
```

### 2. 本番環境で使用

```bash
# デプロイ後、本番環境のURLとAPIキーを使用
curl -X POST https://your-worker.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR_PRODUCTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d @examples/hackernews.json
```

## サンプル一覧

### hackernews.json
- **対象**: Hacker News
- **cacheTTL**: 1800秒（30分）
- **特徴**: シンプルな構造、高頻度更新

### github-trending.json
- **対象**: GitHub Trending
- **cacheTTL**: 7200秒（2時間）
- **特徴**: descriptionフィールド付き

### blog-example.json
- **対象**: 一般的なブログ（サンプル）
- **cacheTTL**: 3600秒（1時間）
- **特徴**: フル機能（description, pubDate, author）

## カスタマイズ

これらのサンプルを参考に、独自の設定を作成できます：

1. サンプルファイルをコピー
2. `id`, `name`, `url`を変更
3. 対象サイトのHTML構造に合わせて`selectors`を調整
4. `cacheTTL`を適切な値に設定

詳細は [CONFIGURATION_GUIDE.md](../CONFIGURATION_GUIDE.md) を参照してください。

## セレクタの調べ方

```bash
# 対象サイトのHTMLをダウンロード
curl https://news.ycombinator.com/ > page.html

# ブラウザで開いて構造を確認
open page.html

# または開発者ツールで直接確認
# 1. ブラウザで対象サイトを開く
# 2. F12で開発者ツールを開く
# 3. 要素を選択して「Copy selector」
```
