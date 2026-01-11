import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SiteForm } from '../components/SiteForm';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { SiteConfig } from '../types';

export const SiteEdit: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { apiKey } = useAuth();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId || !apiKey) return;
    loadConfig();
  }, [siteId, apiKey]);

  const loadConfig = async () => {
    if (!siteId || !apiKey) return;

    try {
      const data = await api.getSite(siteId, apiKey);
      setConfig(data);
    } catch (error) {
      alert('設定の取得に失敗しました');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (updatedConfig: SiteConfig) => {
    if (!siteId || !apiKey) return;

    try {
      await api.updateSite(siteId, updatedConfig, apiKey);
      alert('サイトを更新しました');
      navigate('/');
    } catch (error) {
      alert('更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <Layout>
        <p>読み込み中...</p>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <p>設定が見つかりません</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">サイト編集: {config.name}</h2>
      <SiteForm initialData={config} onSubmit={handleSubmit} submitLabel="更新" />
    </Layout>
  );
};
