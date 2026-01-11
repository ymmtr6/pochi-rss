import type {
  SiteConfig,
  SelectorTestRequest,
  SelectorTestResult,
  SitesListResponse,
} from '../types';

const API_BASE = '/api';

const getAuthHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

export const api = {
  // サイト一覧取得（認証不要）
  getSites: async (): Promise<SitesListResponse> => {
    const res = await fetch('/sites');
    if (!res.ok) throw new Error('Failed to fetch sites');
    return res.json();
  },

  // サイト設定取得
  getSite: async (siteId: string, apiKey: string): Promise<SiteConfig> => {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      headers: getAuthHeaders(apiKey),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch site');
    }
    return res.json();
  },

  // サイト追加
  createSite: async (
    config: SiteConfig,
    apiKey: string
  ): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/sites`, {
      method: 'POST',
      headers: getAuthHeaders(apiKey),
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create site');
    }
    return res.json();
  },

  // サイト更新
  updateSite: async (
    siteId: string,
    config: Partial<SiteConfig>,
    apiKey: string
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: 'PUT',
      headers: getAuthHeaders(apiKey),
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update site');
    }
    return res.json();
  },

  // サイト削除
  deleteSite: async (
    siteId: string,
    apiKey: string
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(apiKey),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete site');
    }
    return res.json();
  },

  // セレクタテスト
  testSelectors: async (
    request: SelectorTestRequest,
    apiKey: string
  ): Promise<SelectorTestResult> => {
    const res = await fetch(`${API_BASE}/test-selectors`, {
      method: 'POST',
      headers: getAuthHeaders(apiKey),
      body: JSON.stringify(request),
    });
    const data = await res.json();
    return data;
  },
};
