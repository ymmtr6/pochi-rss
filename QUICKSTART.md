# クイックスタートガイド

## 最短でデプロイする

GitHubへのアップロードが完了している前提で、最短手順を説明します。

### 方法1: 自動セットアップスクリプト（推奨）

```bash
# リポジトリをクローン（既にある場合はスキップ）
# git clone https://github.com/YOUR-USERNAME/pochi-rss.git
# cd pochi-rss

# 依存関係をインストール
npm install

# デプロイセットアップスクリプトを実行
./deploy-setup.sh
```

このスクリプトが自動的に以下を実行します：
1. ✅ Cloudflareへのログイン
2. ✅ KVネームスペースの作成
3. ✅ wrangler.tomlの更新
4. ✅ APIキーの設定
5. ✅ デプロイ

### 方法2: 手動デプロイ

```bash
# 1. 依存関係をインストール
npm install

# 2. Cloudflareにログイン
npx wrangler login

# 3. KVネームスペース作成
npx wrangler kv:namespace create RSS_STORE
npx wrangler kv:namespace create RSS_STORE --preview

# 4. wrangler.tomlを編集
# 出力されたIDをwrangler.tomlのidとpreview_idに設定

# 5. APIキー設定
npx wrangler secret put API_KEY
# 任意のAPIキーを入力

# 6. デプロイ
npm run deploy
```

---

## デプロイ後の確認

### 1. サービス確認

デプロイ成功時に表示されたURLにアクセス：

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/
```

### 2. テスト用サイト追加

```bash
curl -X POST https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d @examples/hackernews.json
```

### 3. RSSフィード取得

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/feed/hackernews
```

---

## RSSリーダーで購読

取得したURL（例: `https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/feed/hackernews`）を、お好みのRSSリーダーに登録してください。

### 対応RSSリーダー

- Feedly
- Inoreader
- NetNewsWire
- Reeder
- その他、RSS 2.0対応のすべてのリーダー

---

## 独自のサイトを追加

1. 追加したいサイトをブラウザで開く
2. F12で開発者ツールを開く
3. 記事要素を右クリック → 検証
4. CSSセレクタを確認
5. 設定JSONを作成

```json
{
  "id": "my-site",
  "name": "My Favorite Site",
  "url": "https://example.com/blog",
  "cacheTTL": 3600,
  "selectors": {
    "items": "article.post",
    "title": "h2 a",
    "link": "h2 a"
  },
  "feed": {
    "title": "My Site RSS",
    "description": "Latest posts",
    "link": "https://example.com/blog"
  }
}
```

6. APIで追加

```bash
curl -X POST https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d @my-site.json
```

---

## よくある質問

### Q: デプロイにお金はかかりますか？

A: Cloudflare Workersの無料プランで十分です（1日10万リクエストまで無料）。

### Q: 自分のドメインを使えますか？

A: はい。Cloudflareダッシュボードから「Custom Domains」で設定できます。

### Q: 既存のRSSフィードを移行できますか？

A: pochi-rssはスクレイピング専用です。既存のRSSフィードには対応していません。

### Q: JavaScriptで生成されるコンテンツは取得できますか？

A: いいえ。静的なHTMLのみ対応しています。

---

## 次のステップ

✅ デプロイが完了したら：

1. [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) でスクレイピング設定を学ぶ
2. [examples/](./examples/) のサンプルを試す
3. 独自のサイト設定を追加

---

## トラブルシューティング

### エラーが出た場合

詳細は [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) のトラブルシューティングセクションを参照してください。

### ログを確認

```bash
npx wrangler tail
```

リアルタイムでWorkerのログが確認できます。

---

## サポート

- 詳細なデプロイ手順: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- 設定方法: [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)
- コマンド一覧: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
