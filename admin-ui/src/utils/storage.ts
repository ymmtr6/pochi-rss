const API_KEY_STORAGE_KEY = 'pochi_rss_api_key';

export const storage = {
  getApiKey: (): string | null => {
    return sessionStorage.getItem(API_KEY_STORAGE_KEY);
  },

  setApiKey: (apiKey: string): void => {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  },

  clearApiKey: (): void => {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  },
};
