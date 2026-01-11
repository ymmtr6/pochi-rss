# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定

**このリポジトリでは日本語でコミュニケーションを行ってください。**

ユーザーとのやりとり、コメント、コミットメッセージ、ドキュメントなど、すべて日本語で対応してください。

## プロジェクト概要

pochi-rssは、RSSフィードを提供していないWebサイトをスクレイピングして、RSS 2.0形式のフィードとして配信するWebサービスです。Cloudflare Workers上で動作します。

**技術スタック:**
- TypeScript
- Hono (Webフレームワーク)
- cheerio (HTMLパーサー)
- Cloudflare KV (ストレージ)
- Wrangler (デプロイツール)

## 開発コマンド

```bash
npm install          # 依存関係のインストール
npm run dev          # 開発サーバー起動（ローカル開発）
npm run typecheck    # 型チェック
npm run deploy       # Cloudflare Workersへデプロイ
```

## デプロイ手順

初回デプロイ時は以下の手順が必要です：

1. **KVネームスペースの作成**
```bash
wrangler kv:namespace create RSS_STORE
wrangler kv:namespace create RSS_STORE --preview
```

2. **wrangler.tomlの更新**
   - 出力されたKV namespace IDを`wrangler.toml`のidとpreview_idに設定

3. **APIキーの設定**
```bash
wrangler secret put API_KEY
# プロンプトでAPIキーを入力
```

4. **デプロイ**
```bash
npm run deploy
```

## アーキテクチャ

### ディレクトリ構成

- `src/index.ts` - エントリーポイント、Honoアプリケーション定義
- `src/routes/` - APIエンドポイントのハンドラ（feed.ts, admin.ts）
- `src/middlewares/` - 認証ミドルウェア（auth.ts）
- `src/services/` - ビジネスロジック（スクレイピング、RSS生成、キャッシュ、設定管理）
- `src/config/` - 型定義（types.ts）
- `src/types/` - TypeScript型定義（bindings.ts）
- `src/utils/` - ユーティリティ関数

### 主要なコンポーネント

1. **ルーティング層 (Hono)**: リクエストを受け付け、適切なハンドラへルーティング
2. **認証ミドルウェア**: 管理用APIへのアクセスをAPIキー（Bearer Token）で保護
3. **設定管理サービス**: KVストアからサイト設定を取得・保存・削除
4. **スクレイピングサービス**: cheerioを使用してHTMLをパースし、データ抽出
5. **RSS生成サービス**: 抽出データからRSS 2.0 XML形式を生成
6. **キャッシュサービス**: Cloudflare KVでフィードをキャッシュし、負荷軽減

### データフロー

#### RSS配信フロー
1. クライアントが `/feed/:site_id` にリクエスト
2. KVストアでRSSキャッシュ確認（キー: `rss:cache:{site_id}`）
3. KVストアからサイト設定を取得（キー: `config:site:{site_id}`）
4. キャッシュがない場合、対象サイトをスクレイピング
5. cheerioでHTMLパースし、設定に基づきデータ抽出
6. RSS 2.0形式のXMLを生成
7. KVストアにRSSキャッシュ保存（TTL付き）
8. XMLをクライアントに返却

#### 設定管理フロー（管理用API）
1. 管理者が `/api/sites/:site_id` にリクエスト（POST/PUT/DELETE）
2. 認証ミドルウェアでAPIキーを検証
3. リクエストボディのバリデーション
4. KVストアへサイト設定を保存・更新・削除（キー: `config:site:{site_id}`）
5. 関連するRSSキャッシュを削除
6. 成功レスポンスを返却

### 重要な設計ポイント

- **動的な設定管理**: サイト設定はKVストアに保存され、API経由で変更可能（再デプロイ不要）
- **2層キャッシュ**: 設定（永続）とRSS（TTL付き）を分離して管理
- **APIキー認証**: 管理用APIは環境変数のAPI_KEYで保護（Cloudflare Secretsで管理）
- **セレクタベース**: CSSセレクタを使用して、記事一覧、タイトル、リンク、説明などを指定

詳細はREADME.mdを参照してください。
