/**
 * APIキー認証ミドルウェア
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/bindings';

/**
 * Bearer Token認証ミドルウェア
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const authorization = c.req.header('Authorization');

  if (!authorization) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authorization header is required',
      },
      401
    );
  }

  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer' || !token) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid authorization format. Use: Bearer <token>',
      },
      401
    );
  }

  const apiKey = c.env.API_KEY;

  if (token !== apiKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API key',
      },
      401
    );
  }

  await next();
}
