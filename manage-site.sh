#!/bin/bash

# pochi-rss サイト設定管理スクリプト

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "pochi-rss サイト設定管理"
echo "========================================="
echo ""

# デプロイ先の選択
echo "どの環境を使用しますか？"
echo "1) ローカル環境 (http://localhost:8787)"
echo "2) プロダクション環境 (Cloudflare Workers)"
echo ""
read -p "選択 (1 or 2): " ENV_CHOICE

if [ "$ENV_CHOICE" = "1" ]; then
  BASE_URL="http://localhost:8787"
  API_KEY="test-api-key-12345"
  echo -e "${BLUE}📍 ローカル環境を使用します${NC}"
  echo ""
  echo "⚠️  ローカルサーバーが起動していることを確認してください"
  echo "   起動していない場合: npm run dev"
  echo ""
  read -p "Enterキーを押して続行..."
elif [ "$ENV_CHOICE" = "2" ]; then
  echo ""
  read -p "プロダクションURL (例: https://pochi-rss.YOUR-SUBDOMAIN.workers.dev): " PROD_URL
  BASE_URL="${PROD_URL%/}"  # 末尾のスラッシュを削除
  echo ""
  read -sp "APIキーを入力: " API_KEY
  echo ""
  echo -e "${BLUE}📍 プロダクション環境を使用します: $BASE_URL${NC}"
else
  echo -e "${RED}❌ 無効な選択です${NC}"
  exit 1
fi

echo ""
echo "========================================="
echo ""

# 操作の選択
echo "操作を選択してください："
echo "1) サイト一覧を表示"
echo "2) サイト設定を追加"
echo "3) サイト設定を削除"
echo "4) サイト設定を確認"
echo ""
read -p "選択 (1-4): " OPERATION_CHOICE

if [ "$OPERATION_CHOICE" = "1" ]; then
  # サイト一覧を表示
  echo ""
  echo "========================================="
  echo "登録済みサイト一覧"
  echo "========================================="
  echo ""

  SITES_DATA=$(curl -s "$BASE_URL/sites")

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ サイト一覧の取得に失敗しました${NC}"
    exit 1
  fi

  SITE_COUNT=$(echo "$SITES_DATA" | jq -r '.count' 2>/dev/null || echo "0")

  if [ "$SITE_COUNT" = "0" ]; then
    echo -e "${YELLOW}登録済みのサイトはありません${NC}"
  else
    echo -e "${GREEN}登録済みサイト数: $SITE_COUNT 件${NC}"
    echo ""

    echo "$SITES_DATA" | jq -r '.sites[] | "ID: \(.id)\n名前: \(.name)\nフィードURL: \(.feedUrl)\n---"' 2>/dev/null || echo "$SITES_DATA"
  fi

  echo ""
  exit 0

elif [ "$OPERATION_CHOICE" = "2" ]; then
  # サイト設定を追加
  echo ""
  echo "追加方法を選択してください："
  echo "1) JSONファイルから追加"
  echo "2) 対話的に入力して追加"
  echo ""
  read -p "選択 (1 or 2): " METHOD_CHOICE

  if [ "$METHOD_CHOICE" = "1" ]; then
    # JSONファイルから追加
    echo ""
    echo "利用可能なサンプル設定："
    echo ""
    ls -1 examples/*.json 2>/dev/null || echo "  (サンプルファイルが見つかりません)"
    echo ""
    read -p "JSONファイルのパス (例: examples/hackernews.json): " JSON_FILE

    if [ ! -f "$JSON_FILE" ]; then
      echo -e "${RED}❌ ファイルが見つかりません: $JSON_FILE${NC}"
      exit 1
    fi

    echo ""
    echo "設定内容："
    cat "$JSON_FILE" | jq '.' 2>/dev/null || cat "$JSON_FILE"
    echo ""
    read -p "この設定で追加しますか？ (y/n): " CONFIRM

    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "キャンセルしました"
      exit 0
    fi

    echo ""
    echo "追加中..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sites" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d @"$JSON_FILE")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✅ サイト設定を追加しました${NC}"
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

      SITE_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null || echo "")
      if [ ! -z "$SITE_ID" ]; then
        echo ""
        echo "🎉 RSSフィードURL:"
        echo "   $BASE_URL/feed/$SITE_ID"
      fi
    else
      echo -e "${RED}❌ エラーが発生しました (HTTP $HTTP_CODE)${NC}"
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
      exit 1
    fi

  elif [ "$METHOD_CHOICE" = "2" ]; then
    # 対話的に入力
    echo ""
    echo -e "${BLUE}サイト情報を入力してください${NC}"
    echo ""

    read -p "サイトID (英数字とハイフンのみ、例: my-blog): " SITE_ID
    read -p "サイト名 (例: My Blog): " SITE_NAME
    read -p "URL (例: https://example.com/blog): " SITE_URL
    read -p "キャッシュTTL（秒） [デフォルト: 3600]: " CACHE_TTL
    CACHE_TTL=${CACHE_TTL:-3600}

    echo ""
    echo -e "${BLUE}CSSセレクタを入力してください${NC}"
    echo "※ブラウザの開発者ツールで確認できます (F12)"
    echo ""

    read -p "記事一覧セレクタ (例: article.post): " SEL_ITEMS
    read -p "タイトルセレクタ (例: h2.title): " SEL_TITLE
    read -p "リンクセレクタ (例: a): " SEL_LINK
    read -p "説明セレクタ [オプション]: " SEL_DESC
    read -p "公開日セレクタ [オプション]: " SEL_DATE
    read -p "著者セレクタ [オプション]: " SEL_AUTHOR

    echo ""
    echo -e "${BLUE}RSSフィード情報を入力してください${NC}"
    echo ""

    read -p "フィードタイトル (例: My Blog RSS): " FEED_TITLE
    read -p "フィード説明 (例: Latest posts): " FEED_DESC
    read -p "フィードリンク [デフォルト: サイトURLと同じ]: " FEED_LINK
    FEED_LINK=${FEED_LINK:-$SITE_URL}

    # JSON生成
    JSON_DATA=$(cat <<EOF
{
  "id": "$SITE_ID",
  "name": "$SITE_NAME",
  "url": "$SITE_URL",
  "cacheTTL": $CACHE_TTL,
  "selectors": {
    "items": "$SEL_ITEMS",
    "title": "$SEL_TITLE",
    "link": "$SEL_LINK"
EOF
)

    if [ ! -z "$SEL_DESC" ]; then
      JSON_DATA="$JSON_DATA,
    \"description\": \"$SEL_DESC\""
    fi

    if [ ! -z "$SEL_DATE" ]; then
      JSON_DATA="$JSON_DATA,
    \"pubDate\": \"$SEL_DATE\""
    fi

    if [ ! -z "$SEL_AUTHOR" ]; then
      JSON_DATA="$JSON_DATA,
    \"author\": \"$SEL_AUTHOR\""
    fi

    JSON_DATA="$JSON_DATA
  },
  \"feed\": {
    \"title\": \"$FEED_TITLE\",
    \"description\": \"$FEED_DESC\",
    \"link\": \"$FEED_LINK\"
  }
}"

    echo ""
    echo "生成された設定："
    echo "$JSON_DATA" | jq '.' 2>/dev/null || echo "$JSON_DATA"
    echo ""
    read -p "この設定で追加しますか？ (y/n): " CONFIRM

    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "キャンセルしました"
      echo ""
      echo "設定を保存しますか？"
      read -p "ファイル名 (空でスキップ): " SAVE_FILE
      if [ ! -z "$SAVE_FILE" ]; then
        echo "$JSON_DATA" | jq '.' > "$SAVE_FILE" 2>/dev/null || echo "$JSON_DATA" > "$SAVE_FILE"
        echo "保存しました: $SAVE_FILE"
      fi
      exit 0
    fi

    echo ""
    echo "追加中..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sites" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$JSON_DATA")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✅ サイト設定を追加しました${NC}"
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
      echo ""
      echo "🎉 RSSフィードURL:"
      echo "   $BASE_URL/feed/$SITE_ID"
      echo ""
      echo "💾 設定を保存しますか？"
      read -p "ファイル名 (空でスキップ): " SAVE_FILE
      if [ ! -z "$SAVE_FILE" ]; then
        echo "$JSON_DATA" | jq '.' > "$SAVE_FILE" 2>/dev/null || echo "$JSON_DATA" > "$SAVE_FILE"
        echo "保存しました: $SAVE_FILE"
      fi
    else
      echo -e "${RED}❌ エラーが発生しました (HTTP $HTTP_CODE)${NC}"
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
      exit 1
    fi

  else
    echo -e "${RED}❌ 無効な選択です${NC}"
    exit 1
  fi

elif [ "$OPERATION_CHOICE" = "3" ]; then
  # サイト設定を削除
  echo ""
  echo "========================================="
  echo "サイト設定の削除"
  echo "========================================="
  echo ""

  # まずサイト一覧を表示
  echo "登録済みサイト一覧："
  echo ""
  SITES_DATA=$(curl -s "$BASE_URL/sites")
  echo "$SITES_DATA" | jq -r '.sites[] | "  - \(.id) (\(.name))"' 2>/dev/null || echo "$SITES_DATA"
  echo ""

  read -p "削除するサイトID: " DELETE_SITE_ID

  if [ -z "$DELETE_SITE_ID" ]; then
    echo -e "${RED}❌ サイトIDが入力されていません${NC}"
    exit 1
  fi

  echo ""
  read -p "本当に削除しますか？ (y/n): " CONFIRM_DELETE

  if [ "$CONFIRM_DELETE" != "y" ] && [ "$CONFIRM_DELETE" != "Y" ]; then
    echo "キャンセルしました"
    exit 0
  fi

  echo ""
  echo "削除中..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/sites/$DELETE_SITE_ID" \
    -H "Authorization: Bearer $API_KEY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ サイト設定を削除しました${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  else
    echo -e "${RED}❌ エラーが発生しました (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
  fi

elif [ "$OPERATION_CHOICE" = "4" ]; then
  # サイト設定を確認
  echo ""
  echo "========================================="
  echo "サイト設定の確認"
  echo "========================================="
  echo ""

  # まずサイト一覧を表示
  echo "登録済みサイト一覧："
  echo ""
  SITES_DATA=$(curl -s "$BASE_URL/sites")
  echo "$SITES_DATA" | jq -r '.sites[] | "  - \(.id) (\(.name))"' 2>/dev/null || echo "$SITES_DATA"
  echo ""

  read -p "確認するサイトID: " CHECK_SITE_ID

  if [ -z "$CHECK_SITE_ID" ]; then
    echo -e "${RED}❌ サイトIDが入力されていません${NC}"
    exit 1
  fi

  echo ""
  echo "設定を取得中..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/sites/$CHECK_SITE_ID" \
    -H "Authorization: Bearer $API_KEY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ サイト設定:${NC}"
    echo ""
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  else
    echo -e "${RED}❌ エラーが発生しました (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
  fi

else
  echo -e "${RED}❌ 無効な選択です${NC}"
  exit 1
fi

echo ""
echo "========================================="
echo ""

# フィード取得テスト
echo "RSSフィードを取得してテストしますか？ (y/n)"
read -p "> " TEST_FEED

if [ "$TEST_FEED" = "y" ] || [ "$TEST_FEED" = "Y" ]; then
  if [ -z "$SITE_ID" ]; then
    read -p "サイトID: " SITE_ID
  fi

  echo ""
  echo "フィード取得中..."
  FEED_DATA=$(curl -s "$BASE_URL/feed/$SITE_ID")

  # 記事数を確認
  ITEM_COUNT=$(echo "$FEED_DATA" | grep -c "<item>" || echo "0")

  echo ""
  echo "結果:"
  echo "  記事数: $ITEM_COUNT 件"
  echo ""

  if [ "$ITEM_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ フィードの取得に成功しました${NC}"
    echo ""
    echo "最初の30行:"
    echo "$FEED_DATA" | head -30
    echo "..."
  else
    echo -e "${YELLOW}⚠️  記事が取得できませんでした${NC}"
    echo ""
    echo "確認事項:"
    echo "  1. URLが正しいか"
    echo "  2. セレクタが正しいか"
    echo "  3. 対象サイトが正常にアクセスできるか"
    echo ""
    echo "デバッグ情報:"
    echo "$FEED_DATA"
  fi
fi

echo ""
echo "完了！"
echo ""
