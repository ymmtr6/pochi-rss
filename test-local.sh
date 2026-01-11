#!/bin/bash

# ローカルサーバーのURL
BASE_URL="http://localhost:8787"
API_KEY="test-api-key-12345"

echo "========================================="
echo "pochi-rss ローカル動作確認スクリプト"
echo "========================================="
echo ""
echo "注意: 事前に別のターミナルで 'npm run dev' を実行してください"
echo ""

# サーバーが起動しているか確認
echo "1. サーバー起動確認..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$response" != "200" ]; then
  echo "❌ サーバーが起動していません"
  echo "   別のターミナルで 'npm run dev' を実行してください"
  exit 1
fi
echo "✅ サーバーが起動しています"
echo ""

# サービス情報取得
echo "2. サービス情報取得..."
curl -s $BASE_URL | jq '.' 2>/dev/null || curl -s $BASE_URL
echo ""
echo ""

# テスト設定を追加
echo "3. テスト用サイト設定を追加..."
curl -s -X POST $BASE_URL/api/sites \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hackernews",
    "name": "Hacker News Front Page",
    "url": "https://news.ycombinator.com/",
    "cacheTTL": 3600,
    "selectors": {
      "items": "tr.athing",
      "title": "td.title > span > a",
      "link": "td.title > span > a"
    },
    "feed": {
      "title": "Hacker News",
      "description": "Hacker News front page stories",
      "link": "https://news.ycombinator.com/"
    }
  }' | jq '.' 2>/dev/null || echo "設定追加完了"
echo ""
echo ""

# サイト一覧確認
echo "4. サイト一覧取得..."
curl -s $BASE_URL/sites | jq '.' 2>/dev/null || curl -s $BASE_URL/sites
echo ""
echo ""

# RSSフィード取得
echo "5. RSSフィード取得（最初の30行）..."
curl -s $BASE_URL/feed/hackernews | head -30
echo ""
echo "..."
echo ""

echo "========================================="
echo "✅ 動作確認完了"
echo "========================================="
echo ""
echo "詳細なテスト手順は LOCAL_TEST.md を参照してください"
echo ""
echo "ブラウザで確認: $BASE_URL/feed/hackernews"
echo ""
