# pochi-rss

RSS Feedに対応していないWebサイトに対してスクレイピングを行い、RSS Feedを生成・配信するツール。
Cloudflare Workers上で動作します。

## 概要

pochi-rssは、RSSフィードを提供していないWebサイトから情報を取得し、標準的なRSS 2.0形式のフィードとして配信するWebサービスです。スクレイピング設定を柔軟に定義でき、複数のサイトに対応できます。

## 主な機能

- **柔軟なスクレイピング設定**: CSSセレクタを使用してWebページから情報を抽出
- **動的な設定管理**: API経由でサイト設定の追加・更新・削除が可能（再デプロイ不要）
- **RSS 2.0形式での配信**: 標準的なRSSリーダーで購読可能
- **キャッシング機能**: Cloudflare KVを使用して取得結果をキャッシュし、負荷を軽減
- **複数サイト対応**: KVストアで複数のWebサイトを管理
- **API認証**: 管理用APIはAPIキー（Bearer Token）で保護
- **高速・低コスト**: Cloudflare Workersのエッジネットワークで動作

## ドキュメント

- **[CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)** - RSSキャッシュTTLとスクレイピング設定の詳細ガイド
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - よく使う設定とコマンドのクイックリファレンス
- **[LOCAL_TEST.md](./LOCAL_TEST.md)** - ローカル環境での動作確認手順
- **[examples/](./examples/)** - すぐに使えるサンプル設定集

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **言語**: TypeScript
- **Webフレームワーク**: Hono (軽量・高速、Workers最適化)
- **HTMLパーサー**: cheerio (jQuery風のAPI)
- **ストレージ**: Cloudflare KV (設定とキャッシュ)
- **ビルドツール**: Wrangler (Cloudflare Workers CLI)

## アーキテクチャ設計

### システム構成

```
[クライアント (RSSリーダー)]
    ↓ HTTP GET /feed/:site_id
[Cloudflare Workers]
    ├─ ルーティング (Hono)
    ├─ RSSキャッシュ確認 (KV)
    ├─ 設定取得 (KV)
    ├─ スクレイピング処理
    │   ├─ 対象サイトへHTTP GET
    │   ├─ HTMLパース (cheerio)
    │   └─ データ抽出
    ├─ RSS生成
    ├─ RSSキャッシュ保存 (KV)
    └─ RSS配信

[管理者]
    ↓ HTTP POST/PUT/DELETE /api/sites/:site_id
    ↓ Authorization: Bearer {API_KEY}
[Cloudflare Workers]
    ├─ ルーティング (Hono)
    ├─ 認証ミドルウェア (APIキー検証)
    ├─ 設定の追加・更新・削除
    └─ KVストアへ保存
```

### データフロー

#### RSS配信フロー

1. **リクエスト受信**: `/feed/:site_id` でフィード取得リクエストを受ける
2. **RSSキャッシュ確認**: KVストアで有効なRSSキャッシュがあるか確認
3. **設定取得**: KVストアから該当サイトのスクレイピング設定を取得
4. **スクレイピング**: キャッシュがない場合、対象サイトからHTMLを取得
5. **データ抽出**: cheerioでHTMLをパースし、設定に基づいて記事情報を抽出
6. **RSS生成**: 抽出したデータからRSS 2.0形式のXMLを生成
7. **RSSキャッシュ保存**: 生成したRSSをKVストアに保存（TTL設定）
8. **レスポンス**: XMLを `Content-Type: application/rss+xml` で返却

#### 設定管理フロー

1. **リクエスト受信**: `/api/sites/:site_id` で設定の追加・更新・削除リクエストを受ける
2. **認証確認**: Authorizationヘッダーからベアラートークンを取得し、環境変数のAPI_KEYと照合
3. **設定の検証**: リクエストボディのスクレイピング設定を検証
4. **KVストアへ保存**: `config:site:{site_id}` キーで設定を保存
5. **関連キャッシュ削除**: 該当サイトのRSSキャッシュを削除（次回アクセス時に新設定で再生成）
6. **レスポンス**: 成功メッセージを返却

### ディレクトリ構成

```
pochi-rss/
├── src/
│   ├── index.ts                  # エントリーポイント、Honoアプリ定義
│   ├── routes/
│   │   ├── feed.ts               # フィード配信エンドポイント
│   │   └── admin.ts              # 管理用APIエンドポイント
│   ├── middlewares/
│   │   └── auth.ts               # APIキー認証ミドルウェア
│   ├── services/
│   │   ├── scraper.ts            # スクレイピング処理
│   │   ├── rss-generator.ts      # RSS生成処理
│   │   ├── cache.ts              # RSSキャッシュ管理
│   │   └── config-manager.ts     # サイト設定の取得・保存
│   ├── config/
│   │   └── types.ts              # サイト設定の型定義
│   ├── types/
│   │   └── bindings.ts           # Cloudflare Workers環境の型定義
│   └── utils/
│       └── helpers.ts            # ユーティリティ関数
├── wrangler.toml                 # Cloudflare Workers設定
├── package.json
├── tsconfig.json
└── README.md
```

### スクレイピング設定の構造

各サイトの設定は以下の形式で定義します：

```typescript
interface SiteConfig {
  id: string;                    // サイト識別子
  name: string;                  // サイト名
  url: string;                   // スクレイピング対象URL
  cacheTTL: number;              // キャッシュ有効期間（秒）
  selectors: {
    items: string;               // 記事一覧のセレクタ
    title: string;               // タイトルのセレクタ
    link: string;                // リンクのセレクタ
    description?: string;        // 説明のセレクタ（オプション）
    pubDate?: string;            // 公開日のセレクタ（オプション）
    author?: string;             // 著者のセレクタ（オプション）
  };
  feed: {
    title: string;               // RSSフィードのタイトル
    description: string;         // RSSフィードの説明
    link: string;                // RSSフィードのリンク
  };
}
```

### APIエンドポイント

#### 公開エンドポイント

- `GET /` - ヘルスチェック、サービス情報
- `GET /feed/:site_id` - 指定されたサイトのRSSフィードを取得
- `GET /sites` - 利用可能なサイト一覧を取得（JSON）

#### 管理用エンドポイント（要認証）

- `POST /api/sites` - 新しいサイト設定を追加
- `GET /api/sites/:site_id` - 特定のサイト設定を取得
- `PUT /api/sites/:site_id` - サイト設定を更新
- `DELETE /api/sites/:site_id` - サイト設定を削除

**認証方法**:
```bash
Authorization: Bearer YOUR_API_KEY
```

### KVストレージ設計

#### RSSキャッシュ

- **キーフォーマット**: `rss:cache:{site_id}`
- **値**: 生成されたRSS XML文字列
- **TTL**: サイトごとに設定可能（デフォルト: 3600秒 = 1時間）
- **更新タイミング**: キャッシュ期限切れ時に自動更新、または設定変更時に削除

#### サイト設定

- **キーフォーマット**: `config:site:{site_id}`
- **値**: SiteConfig オブジェクトのJSON文字列
- **TTL**: なし（永続化）
- **更新タイミング**: 管理APIによる明示的な更新・削除のみ

### エラーハンドリング

#### RSS配信エンドポイント

- **存在しないsite_id**: 404エラー（設定が見つからない）
- **スクレイピング失敗**: 古いキャッシュがあれば返却、なければ502エラー
- **タイムアウト**: 10秒でタイムアウト、502エラー

#### 管理用エンドポイント

- **認証失敗**: 401エラー（APIキーが無効または未提供）
- **不正な設定**: 400エラー（バリデーションエラー）
- **存在しないsite_id** (更新・削除時): 404エラー

## 開発の流れ

### フェーズ1: プロジェクトセットアップ
- TypeScript + Hono + Wranglerの環境構築
- 基本的なディレクトリ構成の作成
- 型定義の準備（SiteConfig, Bindings等）

### フェーズ2: コア機能実装
- スクレイピング処理の実装（cheerio）
- RSS生成処理の実装（RSS 2.0フォーマット）
- RSSキャッシュ管理の実装
- サイト設定管理の実装（KV読み書き）

### フェーズ3: 認証・ミドルウェア実装
- APIキー認証ミドルウェアの実装
- エラーハンドリングミドルウェア

### フェーズ4: エンドポイント実装
- RSS配信エンドポイント（GET /feed/:site_id）
- サイト一覧エンドポイント（GET /sites）
- 管理用APIエンドポイント（POST/GET/PUT/DELETE /api/sites/:site_id）

### フェーズ5: デプロイと設定
- Cloudflare Workersへのデプロイ
- KVネームスペースの作成と設定
- API_KEYシークレットの設定
- 最初のサイト設定を追加（管理API経由）
- 動作確認

## ローカル開発

### 1. セットアップ

```bash
# 依存関係のインストール
npm install

# 型チェック
npm run typecheck
```

### 2. 開発サーバー起動

```bash
npm run dev
```

サーバーは `http://localhost:8787` で起動します。

### 3. 動作確認

別のターミナルで以下を実行：

```bash
./test-local.sh
```

または、手動でテスト：

```bash
# サービス情報確認
curl http://localhost:8787/

# テスト用サイト設定追加（詳細は LOCAL_TEST.md 参照）
curl -X POST http://localhost:8787/api/sites \
  -H "Authorization: Bearer test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d @test-config.json

# RSSフィード取得
curl http://localhost:8787/feed/hackernews
```

詳細な検証手順は [LOCAL_TEST.md](./LOCAL_TEST.md) を参照してください。

## 使用例

### サイト設定の追加

```bash
curl -X POST https://your-worker.workers.dev/api/sites \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "example-blog",
    "name": "Example Blog",
    "url": "https://example.com/blog",
    "cacheTTL": 3600,
    "selectors": {
      "items": "article.post",
      "title": "h2.title",
      "link": "a.permalink",
      "description": "div.summary",
      "pubDate": "time.published"
    },
    "feed": {
      "title": "Example Blog RSS",
      "description": "Latest posts from Example Blog",
      "link": "https://example.com/blog"
    }
  }'
```

### RSS フィードの取得

```bash
curl https://your-worker.workers.dev/feed/example-blog
```

### サイト一覧の取得

```bash
curl https://your-worker.workers.dev/sites
```

### サイト設定の更新

```bash
curl -X PUT https://your-worker.workers.dev/api/sites/example-blog \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cacheTTL": 1800
  }'
```

### サイト設定の削除

```bash
curl -X DELETE https://your-worker.workers.dev/api/sites/example-blog \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## ライセンス

MIT
