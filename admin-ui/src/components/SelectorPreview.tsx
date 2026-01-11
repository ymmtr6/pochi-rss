import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { SelectorTestRequest, RSSItem } from '../types';

interface Props {
  url: string;
  selectors: SelectorTestRequest['selectors'];
}

export const SelectorPreview: React.FC<Props> = ({ url, selectors }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; items: RSSItem[]; error?: string } | null>(null);
  const { apiKey } = useAuth();

  const handleTest = async () => {
    if (!apiKey || !url || !selectors.items) return;

    setTesting(true);
    try {
      const testResult = await api.testSelectors({ url, selectors }, apiKey);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: 'テストに失敗しました',
        items: [],
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">セレクタプレビュー</h3>
        <button
          onClick={handleTest}
          disabled={testing || !url}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {testing ? 'テスト中...' : 'セレクタをテスト'}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          {result.success ? (
            <div>
              <p className="text-green-600 font-medium mb-2">
                成功: {result.items.length}件抽出
              </p>
              <div className="space-y-2 max-h-96 overflow-auto">
                {result.items.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <p className="font-medium">{item.title}</p>
                    <a
                      href={item.link}
                      className="text-sm text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.link}
                    </a>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.pubDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        公開日: {item.pubDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-600">エラー: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
