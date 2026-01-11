#!/bin/bash

# CSSセレクタテストツール

set -e

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "CSSセレクタテストツール"
echo "========================================="
echo ""

# URLの入力
read -p "テストするサイトのURL: " TARGET_URL

if [ -z "$TARGET_URL" ]; then
  echo "URLが入力されていません"
  exit 1
fi

echo ""
echo "HTMLをダウンロード中..."

# 一時ファイル名
TEMP_FILE="temp_page_$(date +%s).html"

# HTMLをダウンロード
curl -s -L "$TARGET_URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  > "$TEMP_FILE"

if [ ! -s "$TEMP_FILE" ]; then
  echo -e "${YELLOW}⚠️  HTMLのダウンロードに失敗しました${NC}"
  rm -f "$TEMP_FILE"
  exit 1
fi

echo -e "${GREEN}✅ HTMLをダウンロードしました: $TEMP_FILE${NC}"
echo ""

# HTMLのサイズと行数を表示
FILE_SIZE=$(wc -c < "$TEMP_FILE" | tr -d ' ')
LINE_COUNT=$(wc -l < "$TEMP_FILE" | tr -d ' ')
echo "  ファイルサイズ: $FILE_SIZE bytes"
echo "  行数: $LINE_COUNT 行"
echo ""

# セレクタテスト用のHTMLを生成
TEST_HTML="selector_test_$(date +%s).html"

cat > "$TEST_HTML" << 'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSSセレクタテストツール</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      height: calc(100vh - 100px);
    }
    .panel {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: auto;
    }
    h1 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #333;
    }
    .controls {
      margin-bottom: 20px;
    }
    input[type="text"] {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #4a90e2;
    }
    button {
      padding: 10px 20px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    button:hover {
      background: #357abd;
    }
    .result {
      margin-top: 20px;
    }
    .result-item {
      padding: 10px;
      margin: 5px 0;
      background: #f8f9fa;
      border-left: 3px solid #4a90e2;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .count {
      margin: 10px 0;
      padding: 10px;
      background: #e8f4f8;
      border-radius: 4px;
      font-weight: bold;
    }
    .error {
      color: #d32f2f;
      padding: 10px;
      background: #ffebee;
      border-radius: 4px;
      margin: 10px 0;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .help {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .preset {
      margin: 10px 0;
    }
    .preset button {
      margin: 5px 5px 5px 0;
      padding: 5px 10px;
      font-size: 12px;
      background: #6c757d;
    }
  </style>
</head>
<body>
  <h1>🔍 CSSセレクタテストツール</h1>
  <div class="container">
    <div class="panel">
      <h2>セレクタテスト</h2>
      <div class="controls">
        <label>CSSセレクタ:</label>
        <input type="text" id="selector" placeholder="例: article.post">
        <div class="help">記事一覧のセレクタを入力してください</div>

        <div class="preset">
          <strong>よく使うセレクタ:</strong><br>
          <button onclick="testSelector('article')">article</button>
          <button onclick="testSelector('div.post')">div.post</button>
          <button onclick="testSelector('li.item')">li.item</button>
          <button onclick="testSelector('tr.athing')">tr.athing</button>
        </div>

        <button onclick="testSelector()">テスト実行</button>
      </div>

      <div class="result" id="result"></div>

      <div style="margin-top: 20px;">
        <h3>子要素のテスト</h3>
        <div class="controls">
          <label>タイトルセレクタ (items内の相対パス):</label>
          <input type="text" id="titleSelector" placeholder="例: h2.title">
          <div class="help">最初のitemから取得してみます</div>
          <button onclick="testChildSelector('title')">テスト</button>
        </div>

        <div class="controls" style="margin-top: 15px;">
          <label>リンクセレクタ (items内の相対パス):</label>
          <input type="text" id="linkSelector" placeholder="例: a">
          <button onclick="testChildSelector('link')">テスト</button>
        </div>

        <div id="childResult"></div>
      </div>
    </div>

    <div class="panel">
      <h2>元のページ</h2>
      <iframe id="pageFrame"></iframe>
    </div>
  </div>

  <script>
    // 元のHTMLを読み込む
    fetch('TEMP_FILE_PLACEHOLDER')
      .then(r => r.text())
      .then(html => {
        const frame = document.getElementById('pageFrame');
        frame.srcdoc = html;
      });

    function testSelector(preset) {
      const selector = preset || document.getElementById('selector').value;
      if (preset) {
        document.getElementById('selector').value = selector;
      }

      const resultDiv = document.getElementById('result');

      if (!selector) {
        resultDiv.innerHTML = '<div class="error">セレクタを入力してください</div>';
        return;
      }

      try {
        const frame = document.getElementById('pageFrame');
        const doc = frame.contentDocument || frame.contentWindow.document;
        const elements = doc.querySelectorAll(selector);

        let html = `<div class="count">マッチした要素: ${elements.length} 件</div>`;

        if (elements.length > 0) {
          html += '<div style="margin-top: 10px;"><strong>最初の5件:</strong></div>';
          Array.from(elements).slice(0, 5).forEach((el, i) => {
            const text = el.textContent.trim().substring(0, 100);
            const tag = el.tagName.toLowerCase();
            const classes = el.className ? '.' + el.className.split(' ').join('.') : '';
            html += `<div class="result-item">
              <strong>#${i+1}: &lt;${tag}${classes}&gt;</strong><br>
              ${text}...
            </div>`;
          });

          if (elements.length > 5) {
            html += `<div style="margin-top: 10px; color: #666;">... 他 ${elements.length - 5} 件</div>`;
          }
        } else {
          html += '<div class="error">要素が見つかりませんでした</div>';
        }

        resultDiv.innerHTML = html;
      } catch (e) {
        resultDiv.innerHTML = `<div class="error">エラー: ${e.message}</div>`;
      }
    }

    function testChildSelector(type) {
      const itemsSelector = document.getElementById('selector').value;
      const childSelector = document.getElementById(type + 'Selector').value;
      const resultDiv = document.getElementById('childResult');

      if (!itemsSelector || !childSelector) {
        resultDiv.innerHTML = '<div class="error">両方のセレクタを入力してください</div>';
        return;
      }

      try {
        const frame = document.getElementById('pageFrame');
        const doc = frame.contentDocument || frame.contentWindow.document;
        const items = doc.querySelectorAll(itemsSelector);

        if (items.length === 0) {
          resultDiv.innerHTML = '<div class="error">itemsが見つかりません</div>';
          return;
        }

        const firstItem = items[0];
        const childElements = firstItem.querySelectorAll(childSelector);

        let html = `<div class="count">最初のitemから ${childElements.length} 件見つかりました</div>`;

        if (childElements.length > 0) {
          Array.from(childElements).slice(0, 3).forEach((el, i) => {
            const text = el.textContent.trim().substring(0, 100);
            const href = el.getAttribute('href') || '';
            html += `<div class="result-item">
              <strong>#${i+1}:</strong> ${text}<br>
              ${href ? `<small>href: ${href}</small>` : ''}
            </div>`;
          });
        } else {
          html += '<div class="error">要素が見つかりませんでした</div>';
        }

        resultDiv.innerHTML = html;
      } catch (e) {
        resultDiv.innerHTML = `<div class="error">エラー: ${e.message}</div>`;
      }
    }

    // Enterキーでテスト実行
    document.getElementById('selector').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        testSelector();
      }
    });
  </script>
</body>
</html>
EOF

# プレースホルダーを実際のファイル名に置換
sed -i.bak "s|TEMP_FILE_PLACEHOLDER|$TEMP_FILE|g" "$TEST_HTML"
rm -f "${TEST_HTML}.bak"

echo -e "${GREEN}✅ テストページを生成しました: $TEST_HTML${NC}"
echo ""
echo "========================================="
echo ""
echo "次のステップ:"
echo ""
echo "1. ブラウザでテストページを開く:"
echo "   open $TEST_HTML"
echo ""
echo "2. セレクタをテストする"
echo "   - 左側でセレクタを入力"
echo "   - 「テスト実行」をクリック"
echo "   - 右側で元のページを確認"
echo ""
echo "3. うまくいったら、セレクタをメモ"
echo ""
echo "4. manage-site.sh で設定を追加"
echo ""
echo -e "${YELLOW}⚠️  テスト後、一時ファイルを削除してください:${NC}"
echo "   rm $TEMP_FILE $TEST_HTML"
echo ""

# 自動的にブラウザで開く（macOSの場合）
if [[ "$OSTYPE" == "darwin"* ]]; then
  read -p "ブラウザで開きますか？ (y/n): " OPEN_BROWSER
  if [ "$OPEN_BROWSER" = "y" ] || [ "$OPEN_BROWSER" = "Y" ]; then
    open "$TEST_HTML"
  fi
fi
