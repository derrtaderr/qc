import Redis from 'ioredis';
import { AnalysisResult } from '@/types/analysis';

class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  /**
   * Generate a cache key for a PDF file
   */
  private generateKey(fileHash: string, analysisType: string): string {
    return `pdf:${fileHash}:${analysisType}`;
  }

  /**
   * Store analysis results in cache
   */
  async cacheAnalysisResult(
    fileHash: string,
    analysisType: string,
    result: AnalysisResult,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.generateKey(fileHash, analysisType);
    await this.redis.setex(key, ttl, JSON.stringify(result));
  }

  /**
   * Retrieve analysis results from cache
   */
  async getAnalysisResult(
    fileHash: string,
    analysisType: string
  ): Promise<AnalysisResult | null> {
    const key = this.generateKey(fileHash, analysisType);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Store partial analysis results for large files
   */
  async cachePartialResult(
    fileHash: string,
    analysisType: string,
    pageNumber: number,
    result: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.generateKey(fileHash, `${analysisType}:page:${pageNumber}`);
    await this.redis.setex(key, ttl, JSON.stringify(result));
  }

  /**
   * Retrieve partial analysis results
   */
  async getPartialResult(
    fileHash: string,
    analysisType: string,
    pageNumber: number
  ): Promise<any | null> {
    const key = this.generateKey(fileHash, `${analysisType}:page:${pageNumber}`);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Clear cache for a specific file
   */
  async clearFileCache(fileHash: string): Promise<void> {
    const pattern = this.generateKey(fileHash, '*');
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Check if analysis result exists in cache
   */
  async hasAnalysisResult(
    fileHash: string,
    analysisType: string
  ): Promise<boolean> {
    const key = this.generateKey(fileHash, analysisType);
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    hitCount: number;
    missCount: number;
    memoryUsage: number;
  }> {
    const info = await this.redis.info();
    const stats = {
      hitCount: 0,
      missCount: 0,
      memoryUsage: 0,
    };

    // Parse Redis INFO command output
    const lines = info.split('\n');
    for (const line of lines) {
      if (line.startsWith('keyspace_hits:')) {
        stats.hitCount = parseInt(line.split(':')[1]);
      } else if (line.startsWith('keyspace_misses:')) {
        stats.missCount = parseInt(line.split(':')[1]);
      } else if (line.startsWith('used_memory:')) {
        stats.memoryUsage = parseInt(line.split(':')[1]);
      }
    }

    return stats;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 