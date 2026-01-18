/**
 * リクエストボディサイズ制限ミドルウェア
 */

import { Context, Next } from 'hono';

/**
 * リクエストボディサイズを制限するミドルウェア
 * @param maxSize 最大サイズ（バイト）デフォルト: 10KB
 */
export function bodyLimit(maxSize: number = 10 * 1024) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (isNaN(size) || size > maxSize) {
        return c.json(
          {
            error: 'Payload Too Large',
            message: `Request body size exceeds the limit of ${maxSize} bytes`,
          },
          413
        );
      }
    }

    await next();
  };
}
