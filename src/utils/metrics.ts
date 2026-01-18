/**
 * メトリクス収集ユーティリティ
 */

/**
 * メトリクスデータ
 */
interface MetricData {
  scrapingDuration: { count: number; total: number; avg: number };
  cacheHits: { hits: number; misses: number; rate: number };
  errors: { count: number };
  requests: { count: number };
}

/**
 * グローバルメトリクスストア（メモリ内）
 * Cloudflare Workersでは各リクエストが独立したコンテキストで実行されるため、
 * 永続化されたメトリクスを収集するにはDurable ObjectsやKVなどが必要。
 * ここでは簡易的なメモリ内ストアを使用。
 */
class MetricsStore {
  private scrapingDurations: number[] = [];
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private errorCount: number = 0;
  private requestCount: number = 0;

  /**
   * スクレイピング時間を記録
   */
  recordScrapingDuration(siteId: string, durationMs: number): void {
    this.scrapingDurations.push(durationMs);
    // メモリを節約するため、最新100件のみ保持
    if (this.scrapingDurations.length > 100) {
      this.scrapingDurations.shift();
    }
  }

  /**
   * キャッシュヒット/ミスを記録
   */
  recordCacheAccess(siteId: string, hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * エラーを記録
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * リクエストを記録
   */
  recordRequest(): void {
    this.requestCount++;
  }

  /**
   * メトリクスを取得
   */
  getMetrics(): MetricData {
    const scrapingCount = this.scrapingDurations.length;
    const scrapingTotal = this.scrapingDurations.reduce((sum, d) => sum + d, 0);
    const scrapingAvg = scrapingCount > 0 ? scrapingTotal / scrapingCount : 0;

    const cacheTotal = this.cacheHits + this.cacheMisses;
    const cacheRate = cacheTotal > 0 ? this.cacheHits / cacheTotal : 0;

    return {
      scrapingDuration: {
        count: scrapingCount,
        total: Math.round(scrapingTotal),
        avg: Math.round(scrapingAvg),
      },
      cacheHits: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        rate: Math.round(cacheRate * 100) / 100,
      },
      errors: {
        count: this.errorCount,
      },
      requests: {
        count: this.requestCount,
      },
    };
  }

  /**
   * メトリクスをリセット
   */
  reset(): void {
    this.scrapingDurations = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errorCount = 0;
    this.requestCount = 0;
  }
}

// シングルトンインスタンス
const metricsStore = new MetricsStore();

/**
 * メトリクスAPI
 */
export const metrics = {
  /**
   * スクレイピング時間を記録
   */
  recordScrapingDuration: (siteId: string, durationMs: number) => {
    metricsStore.recordScrapingDuration(siteId, durationMs);
  },

  /**
   * キャッシュヒット/ミスを記録
   */
  recordCacheAccess: (siteId: string, hit: boolean) => {
    metricsStore.recordCacheAccess(siteId, hit);
  },

  /**
   * エラーを記録
   */
  recordError: () => {
    metricsStore.recordError();
  },

  /**
   * リクエストを記録
   */
  recordRequest: () => {
    metricsStore.recordRequest();
  },

  /**
   * メトリクスを取得
   */
  getMetrics: () => {
    return metricsStore.getMetrics();
  },

  /**
   * メトリクスをリセット
   */
  reset: () => {
    metricsStore.reset();
  },
};
