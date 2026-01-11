import React, { useState } from 'react';
import type { SiteConfig } from '../types';
import { SelectorPreview } from './SelectorPreview';

interface Props {
  initialData?: SiteConfig;
  onSubmit: (config: SiteConfig) => Promise<void>;
  submitLabel: string;
}

export const SiteForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  submitLabel,
}) => {
  const [config, setConfig] = useState<SiteConfig>(
    initialData || {
      id: '',
      name: '',
      url: '',
      cacheTTL: 3600,
      selectors: {
        items: '',
        title: '',
        link: '',
        description: '',
        pubDate: '',
        author: '',
      },
      feed: {
        title: '',
        description: '',
        link: '',
      },
    }
  );

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(config);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">基本情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              サイトID
            </label>
            <input
              type="text"
              value={config.id}
              onChange={(e) => setConfig({ ...config, id: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
              disabled={!!initialData}
              placeholder="例: my-blog"
            />
            <p className="text-xs text-gray-500 mt-1">
              英数字とハイフンのみ使用可能
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">サイト名</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
              placeholder="例: My Blog"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              スクレイピング対象URL
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
              placeholder="例: https://example.com/blog"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              キャッシュTTL（秒）
            </label>
            <input
              type="number"
              value={config.cacheTTL}
              onChange={(e) =>
                setConfig({ ...config, cacheTTL: parseInt(e.target.value) })
              }
              className="w-full border rounded px-3 py-2"
              required
              min="60"
            />
            <p className="text-xs text-gray-500 mt-1">
              推奨: 3600秒（1時間）
            </p>
          </div>
        </div>
      </div>

      {/* セレクタ設定 */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">CSSセレクタ設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              記事一覧（必須）
            </label>
            <input
              type="text"
              value={config.selectors.items}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: { ...config.selectors, items: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: article.post"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              タイトル（必須）
            </label>
            <input
              type="text"
              value={config.selectors.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: { ...config.selectors, title: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: h2.title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              リンク（必須）
            </label>
            <input
              type="text"
              value={config.selectors.link}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: { ...config.selectors, link: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: a.permalink"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              説明（オプション）
            </label>
            <input
              type="text"
              value={config.selectors.description || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: {
                    ...config.selectors,
                    description: e.target.value,
                  },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: div.summary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              公開日（オプション）
            </label>
            <input
              type="text"
              value={config.selectors.pubDate || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: { ...config.selectors, pubDate: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: time.published"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              著者（オプション）
            </label>
            <input
              type="text"
              value={config.selectors.author || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  selectors: { ...config.selectors, author: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="例: span.author"
            />
          </div>
        </div>
      </div>

      {/* セレクタプレビュー */}
      {config.url && config.selectors.items && (
        <SelectorPreview url={config.url} selectors={config.selectors} />
      )}

      {/* RSSフィード情報 */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">RSSフィード情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              フィードタイトル
            </label>
            <input
              type="text"
              value={config.feed.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  feed: { ...config.feed, title: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              required
              placeholder="例: My Blog RSS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              フィード説明
            </label>
            <input
              type="text"
              value={config.feed.description}
              onChange={(e) =>
                setConfig({
                  ...config,
                  feed: { ...config.feed, description: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              required
              placeholder="例: Latest posts from My Blog"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              フィードリンク
            </label>
            <input
              type="url"
              value={config.feed.link}
              onChange={(e) =>
                setConfig({
                  ...config,
                  feed: { ...config.feed, link: e.target.value },
                })
              }
              className="w-full border rounded px-3 py-2"
              required
              placeholder="例: https://example.com/blog"
            />
          </div>
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? '送信中...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
