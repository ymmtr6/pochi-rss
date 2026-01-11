import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SiteForm } from '../components/SiteForm';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { SiteConfig } from '../types';

export const SiteAdd: React.FC = () => {
  const navigate = useNavigate();
  const { apiKey } = useAuth();

  const handleSubmit = async (config: SiteConfig) => {
    if (!apiKey) return;

    try {
      await api.createSite(config, apiKey);
      alert('サイトを追加しました');
      navigate('/');
    } catch (error) {
      alert(
        '追加に失敗しました: ' + (error instanceof Error ? error.message : '')
      );
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">サイト新規追加</h2>
      <SiteForm onSubmit={handleSubmit} submitLabel="追加" />
    </Layout>
  );
};
