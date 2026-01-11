# Cloudflare Workersへのデプロイガイド

## 前提条件

- GitHubへのアップロードが完了していること ✅
- Cloudflareアカウント（無料プランでOK）
- ローカルに本プロジェクトのコード

## 手順1: Cloudflareアカウントの準備

### 1-1. Cloudflareアカウント作成

まだアカウントがない場合：

1. https://dash.cloudflare.com/sign-up にアクセス
2. メールアドレスとパスワードを入力して登録
3. メール認証を完了

### 1-2. Wranglerでログイン

ターミナルで以下を実行：

```bash
npx wrangler login
```

ブラウザが開き、Cloudflareへのログインが求められます。
ログインすると、ターミナルに「Successfully logged in」と表示されます。

---

## 手順2: KVネームスペースの作成

RSSキャッシュとサイト設定を保存するためのKVストレージを作成します。

### 2-1. 本番用KVネームスペース作成

```bash
npx wrangler kv:namespace create RSS_STORE
```

実行結果の例：
```
🌀 Creating namespace with title "pochi-rss-RSS_STORE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "RSS_STORE", id = "abc123def456..." }
```

**この`id`の値をメモしておいてください。**

### 2-2. プレビュー用KVネームスペース作成

```bash
npx wrangler kv:namespace create RSS_STORE --preview
```

実行結果の例：
```
🌀 Creating namespace with title "pochi-rss-RSS_STORE_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "RSS_STORE", preview_id = "xyz789ghi012..." }
```

**この`preview_id`の値もメモしておいてください。**

---

## 手順3: wrangler.tomlの更新

`wrangler.toml`を開いて、KV namespace IDを設定します。

### 3-1. 現在の設定を確認

```bash
cat wrangler.toml
```

### 3-2. IDを更新

`wrangler.toml`の以下の部分を、手順2でメモしたIDに置き換えます：

```toml
[[kv_namespaces]]
binding = "RSS_STORE"
id = "ここに手順2-1のidを貼り付け"
preview_id = "ここに手順2-2のpreview_idを貼り付け"
```

**編集例:**
```toml
[[kv_namespaces]]
binding = "RSS_STORE"
id = "abc123def456..."
preview_id = "xyz789ghi012..."
```

保存してください。

---

## 手順4: APIキーの設定

管理用APIを保護するためのAPIキーを設定します。

### 4-1. APIキーを設定

```bash
npx wrangler secret put API_KEY
```

プロンプトが表示されるので、任意のAPIキーを入力してEnter：
```
Enter a secret value: ********（好きなAPIキーを入力）
```

**このAPIキーは後で使うのでメモしておいてください。**

推奨：
- 英数字と記号を混ぜた32文字以上
- 例: `my-super-secret-api-key-2026-pochi-rss`

---

## 手順5: デプロイ実行

### 5-1. 最終確認

デプロイ前に型チェックを実行：

```bash
npm run typecheck
```

エラーがないことを確認してください。

### 5-2. デプロイ

```bash
npm run deploy
```

または

```bash
npx wrangler deploy
```

### 5-3. デプロイ完了

成功すると以下のような出力が表示されます：

```
Total Upload: xx.xx KiB / gzip: yy.yy KiB
Uploaded pochi-rss (x.xx sec)
Published pochi-rss (x.xx sec)
  https://pochi-rss.YOUR-SUBDOMAIN.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**`https://pochi-rss.YOUR-SUBDOMAIN.workers.dev` がデプロイ先URLです。**

---

## 手順6: 動作確認

### 6-1. サービス情報を確認

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/
```

レスポンス例：
```json
{
  "name": "pochi-rss",
  "version": "1.0.0",
  "description": "RSS Feed generator for websites without RSS support",
  ...
}
```

### 6-2. テスト用サイト設定を追加

Hacker Newsのサンプルを追加：

```bash
curl -X POST https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d @examples/hackernews.json
```

**`YOUR-API-KEY`は手順4で設定したAPIキーに置き換えてください。**

成功すると：
```json
{
  "message": "Site config created successfully",
  "id": "hackernews"
}
```

### 6-3. RSSフィードを取得

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/feed/hackernews
```

RSS XMLが返ってくれば成功です！

### 6-4. RSSリーダーで購読

RSSリーダーアプリ（Feedly、Inoreaderなど）で以下のURLを登録：

```
https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/feed/hackernews
```

---

## カスタムドメインの設定（オプション）

### 独自ドメインを使いたい場合

1. Cloudflareダッシュボードを開く
2. Workers & Pages → Overview → pochi-rss を選択
3. Settings → Triggers → Custom Domains
4. 「Add Custom Domain」をクリック
5. 所有しているドメインを入力（例: `rss.example.com`）

これにより、`https://rss.example.com/feed/hackernews` のようなURLで使えます。

---

## トラブルシューティング

### エラー: "A request to the Cloudflare API failed"

**原因**: ログインしていない、または認証が切れている

**解決策**:
```bash
npx wrangler logout
npx wrangler login
```

### エラー: "Namespace not found"

**原因**: wrangler.tomlのKV namespace IDが間違っている

**解決策**:
1. `npx wrangler kv:namespace list` で正しいIDを確認
2. wrangler.tomlを修正

### エラー: "Unauthorized" (401)

**原因**: APIキーが間違っている

**解決策**:
1. APIキーを再設定: `npx wrangler secret put API_KEY`
2. リクエスト時のAuthorizationヘッダーを確認

### デプロイ後、古いコードが動いている

**原因**: キャッシュが残っている

**解決策**:
```bash
# 強制的に再デプロイ
npx wrangler deploy --compatibility-date=$(date +%Y-%m-%d)
```

---

## 更新とメンテナンス

### コードを更新してデプロイ

```bash
# 1. コードを修正
# 2. 型チェック
npm run typecheck

# 3. デプロイ
npm run deploy
```

### ログの確認

```bash
npx wrangler tail
```

リアルタイムでWorkerのログを確認できます。

### 設定の確認

本番環境のサイト設定一覧：

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/sites
```

特定の設定を確認：

```bash
curl https://pochi-rss.YOUR-SUBDOMAIN.workers.dev/api/sites/hackernews \
  -H "Authorization: Bearer YOUR-API-KEY"
```

---

## セキュリティ注意事項

### APIキーの管理

- **絶対にGitHubにコミットしない**（`.dev.vars`は`.gitignore`に含まれています）
- APIキーは定期的に変更
- 変更方法: `npx wrangler secret put API_KEY`

### 公開範囲

- `/feed/:site_id` と `/sites` は誰でもアクセス可能（公開RSS配信用）
- `/api/*` はAPIキー必須（管理用）

必要に応じてCloudflare Accessで追加の認証を設定できます。

---

## コスト

### Cloudflare Workers 無料プラン

- **リクエスト数**: 100,000リクエスト/日
- **CPU時間**: 10ms/リクエスト
- **KVストレージ**: 1GB
- **KV読み取り**: 100,000回/日
- **KV書き込み**: 1,000回/日

通常の使用であれば無料プランで十分です。

詳細: https://developers.cloudflare.com/workers/platform/pricing/

---

## 次のステップ

✅ デプロイ完了後：

1. [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) を参考に、独自のサイト設定を追加
2. RSSリーダーで購読してテスト
3. 必要に応じてcacheTTLを調整

---

## 便利なコマンドまとめ

```bash
# ログイン
npx wrangler login

# KV一覧確認
npx wrangler kv:namespace list

# デプロイ
npm run deploy

# ログ監視
npx wrangler tail

# シークレット一覧
npx wrangler secret list

# シークレット削除
npx wrangler secret delete API_KEY
```

---

## サポート

問題が発生した場合：

1. [Cloudflare Workersドキュメント](https://developers.cloudflare.com/workers/)
2. [Wranglerドキュメント](https://developers.cloudflare.com/workers/wrangler/)
3. プロジェクトのGitHub Issues

デプロイに成功したら、ぜひRSSフィードを活用してください！
