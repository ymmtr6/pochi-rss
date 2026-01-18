/**
 * APIキー認証ミドルウェアのテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from './auth';
import type { Env } from '../types/bindings';

describe('authMiddleware', () => {
  const createApp = () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use('/*', authMiddleware);
    app.get('/test', (c) => c.json({ success: true }));
    return app;
  };

  const mockEnv = {
    API_KEY: 'test-api-key-12345',
    RSS_STORE: {} as KVNamespace,
  };

  it('有効なBearer Tokenで認証成功する', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'Bearer test-api-key-12345',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  it('Authorizationヘッダーがない場合は401を返す', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test');

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toBe('Unauthorized');
    expect(json.message).toBe('Authorization header is required');
  });

  it('Bearer形式でない場合は401を返す', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'Basic dGVzdDp0ZXN0',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toBe('Unauthorized');
    expect(json.message).toContain('Invalid authorization format');
  });

  it('トークンが空の場合は401を返す', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'Bearer ',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('不正なAPIキーの場合は401を返す', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'Bearer wrong-api-key',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
    const json: any = await res.json();
    expect(json.error).toBe('Unauthorized');
    expect(json.message).toBe('Invalid API key');
  });

  it('Bearerの大文字小文字を区別する', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'bearer test-api-key-12345',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
  });

  it('トークン前後の空白を許容しない', async () => {
    const app = createApp();
    const req = new Request('http://localhost/test', {
      headers: {
        Authorization: 'Bearer  test-api-key-12345 ',
      },
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(401);
  });
});
