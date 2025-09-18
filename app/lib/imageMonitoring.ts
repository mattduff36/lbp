/**
 * Image monitoring and analytics utilities
 */

interface ImageRequestLog {
  timestamp: string;
  url: string;
  type: 'api' | 'proxy' | 'direct';
  cacheHit?: boolean;
  responseTime?: number;
  error?: string;
}

// In-memory store for recent requests (production should use external storage)
const requestLogs: ImageRequestLog[] = [];
const MAX_LOGS = 1000;

/**
 * Log an image request for monitoring
 */
export function logImageRequest(log: Omit<ImageRequestLog, 'timestamp'>) {
  const entry: ImageRequestLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  requestLogs.push(entry);

  // Keep only recent logs
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.splice(0, requestLogs.length - MAX_LOGS);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[IMAGE_MONITOR]', entry);
  }
}

/**
 * Get image request statistics
 */
export function getImageStats(hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentLogs = requestLogs.filter(log => new Date(log.timestamp) > cutoff);

  const stats = {
    totalRequests: recentLogs.length,
    apiRequests: recentLogs.filter(log => log.type === 'api').length,
    proxyRequests: recentLogs.filter(log => log.type === 'proxy').length,
    directRequests: recentLogs.filter(log => log.type === 'direct').length,
    errors: recentLogs.filter(log => log.error).length,
    cacheHits: recentLogs.filter(log => log.cacheHit).length,
    averageResponseTime: 0,
  };

  const responseTimes = recentLogs
    .filter(log => log.responseTime)
    .map(log => log.responseTime!);

  if (responseTimes.length > 0) {
    stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  return stats;
}

/**
 * Create a monitoring middleware for API routes
 */
export function withImageMonitoring<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  type: ImageRequestLog['type']
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const request = args[0] as Request;
    
    try {
      const response = await handler(...args);
      const responseTime = Date.now() - startTime;
      
      logImageRequest({
        url: request.url,
        type,
        responseTime,
        cacheHit: response.headers.get('x-vercel-cache') === 'HIT',
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logImageRequest({
        url: request.url,
        type,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }) as T;
}
