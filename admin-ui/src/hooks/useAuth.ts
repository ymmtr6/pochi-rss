import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export const useAuth = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = storage.getApiKey();
    if (key) {
      setApiKey(key);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (key: string) => {
    storage.setApiKey(key);
    setApiKey(key);
    setIsAuthenticated(true);
  };

  const logout = () => {
    storage.clearApiKey();
    setApiKey(null);
    setIsAuthenticated(false);
  };

  return { apiKey, isAuthenticated, loading, login, logout };
};
