import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Site } from '../types';

export const SiteList: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiKey } = useAuth();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await api.getSites();
      setSites(data.sites);
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!apiKey) return;
    if (!window.confirm('本当に削除しますか？')) return;

    try {
      await api.deleteSite(siteId, apiKey);
      await loadSites();
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">サイト一覧</h2>
        <Link
          to="/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新規追加
        </Link>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : sites.length === 0 ? (
        <p className="text-gray-600">登録されているサイトがありません</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">名前</th>
              <th className="px-4 py-2 text-left">フィードURL</th>
              <th className="px-4 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} className="border-t">
                <td className="px-4 py-2">{site.id}</td>
                <td className="px-4 py-2">{site.name}</td>
                <td className="px-4 py-2">
                  <a
                    href={site.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {site.feedUrl}
                  </a>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Link
                    to={`/edit/${site.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
};
