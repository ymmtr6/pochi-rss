/**
 * 構造化ロギングユーティリティ
 */

export type LogLevel = 'info' | 'warn' | 'error';

interface LogData {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * 構造化ログを出力
 */
function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const logData: LogData = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const logString = JSON.stringify(logData);

  switch (level) {
    case 'error':
      console.error(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    case 'info':
    default:
      console.log(logString);
      break;
  }
}

/**
 * 構造化ロガー
 */
export const logger = {
  /**
   * 情報ログ
   */
  info: (message: string, meta?: Record<string, unknown>) => {
    log('info', message, meta);
  },

  /**
   * 警告ログ
   */
  warn: (message: string, meta?: Record<string, unknown>) => {
    log('warn', message, meta);
  },

  /**
   * エラーログ
   * エラーオブジェクトを受け取り、スタックトレースを含めてログに記録
   */
  error: (message: string, error: Error, meta?: Record<string, unknown>) => {
    log('error', message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    });
  },
};
