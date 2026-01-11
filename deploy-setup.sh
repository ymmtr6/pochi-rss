#!/bin/bash

# pochi-rss デプロイセットアップスクリプト

set -e

echo "========================================="
echo "pochi-rss デプロイセットアップ"
echo "========================================="
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Wranglerログイン確認
echo "📝 ステップ1: Cloudflareへのログイン確認"
echo ""

if npx wrangler whoami > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 既にログイン済みです${NC}"
  npx wrangler whoami
else
  echo -e "${YELLOW}⚠️  ログインが必要です${NC}"
  echo "ブラウザが開きますので、Cloudflareアカウントでログインしてください..."
  echo ""
  npx wrangler login
fi

echo ""
echo "========================================="
echo ""

# 2. KVネームスペース作成
echo "📦 ステップ2: KVネームスペースの作成"
echo ""

echo "本番用KVネームスペースを作成します..."
PROD_OUTPUT=$(npx wrangler kv:namespace create RSS_STORE 2>&1)
echo "$PROD_OUTPUT"

# IDを抽出
PROD_ID=$(echo "$PROD_OUTPUT" | grep -oE 'id = "[^"]+' | cut -d'"' -f2 || echo "")

echo ""
echo "プレビュー用KVネームスペースを作成します..."
PREVIEW_OUTPUT=$(npx wrangler kv:namespace create RSS_STORE --preview 2>&1)
echo "$PREVIEW_OUTPUT"

# preview_idを抽出
PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -oE 'preview_id = "[^"]+' | cut -d'"' -f2 || echo "")

echo ""

if [ -z "$PROD_ID" ] || [ -z "$PREVIEW_ID" ]; then
  echo -e "${YELLOW}⚠️  KVネームスペースのIDを自動取得できませんでした${NC}"
  echo "手動でwrangler.tomlを編集してください。"
  echo ""
  echo "本番用ID: $PROD_ID"
  echo "プレビュー用ID: $PREVIEW_ID"
  echo ""
else
  echo -e "${GREEN}✅ KVネームスペースを作成しました${NC}"
  echo ""
  echo "本番用ID: $PROD_ID"
  echo "プレビュー用ID: $PREVIEW_ID"
  echo ""

  # wrangler.tomlを更新
  echo "wrangler.tomlを更新しています..."
  sed -i.bak "s/id = \"YOUR_KV_NAMESPACE_ID\"/id = \"$PROD_ID\"/" wrangler.toml
  sed -i.bak "s/preview_id = \"YOUR_PREVIEW_KV_NAMESPACE_ID\"/preview_id = \"$PREVIEW_ID\"/" wrangler.toml
  rm wrangler.toml.bak
  echo -e "${GREEN}✅ wrangler.tomlを更新しました${NC}"
fi

echo ""
echo "========================================="
echo ""

# 3. APIキー設定
echo "🔑 ステップ3: APIキーの設定"
echo ""
echo "管理用APIを保護するためのAPIキーを設定します。"
echo "英数字と記号を混ぜた32文字以上を推奨します。"
echo ""

npx wrangler secret put API_KEY

echo ""
echo -e "${GREEN}✅ APIキーを設定しました${NC}"
echo ""
echo "========================================="
echo ""

# 4. デプロイ
echo "🚀 ステップ4: デプロイ"
echo ""
echo "Cloudflare Workersにデプロイしますか？ (y/n)"
read -r DEPLOY_CONFIRM

if [ "$DEPLOY_CONFIRM" = "y" ] || [ "$DEPLOY_CONFIRM" = "Y" ]; then
  echo ""
  echo "型チェックを実行しています..."
  npm run typecheck

  echo ""
  echo "デプロイを開始します..."
  npm run deploy

  echo ""
  echo -e "${GREEN}=========================================${NC}"
  echo -e "${GREEN}✅ デプロイ完了！${NC}"
  echo -e "${GREEN}=========================================${NC}"
  echo ""
  echo "デプロイ先URLが表示されているはずです。"
  echo "例: https://pochi-rss.YOUR-SUBDOMAIN.workers.dev"
  echo ""
  echo "次のステップ:"
  echo "1. サービス情報確認: curl https://YOUR-URL/"
  echo "2. サイト設定追加: curl -X POST https://YOUR-URL/api/sites -H \"Authorization: Bearer YOUR-API-KEY\" -H \"Content-Type: application/json\" -d @examples/hackernews.json"
  echo "3. RSSフィード取得: curl https://YOUR-URL/feed/hackernews"
  echo ""
else
  echo ""
  echo "デプロイはスキップされました。"
  echo "後で手動でデプロイする場合は: npm run deploy"
  echo ""
fi

echo "詳細は DEPLOY_GUIDE.md を参照してください。"
echo ""
