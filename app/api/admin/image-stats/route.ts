import { NextRequest, NextResponse } from 'next/server';
import { getImageStats } from '@/app/lib/imageMonitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const stats = getImageStats(hours);

    return NextResponse.json({
      stats,
      period: `${hours} hours`,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(stats),
    });
  } catch (error) {
    console.error('Error fetching image stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image statistics' },
      { status: 500 }
    );
  }
}

function generateRecommendations(stats: any) {
  const recommendations = [];

  if (stats.errors > stats.totalRequests * 0.05) {
    recommendations.push('High error rate detected. Check image URLs and proxy configuration.');
  }

  if (stats.cacheHits / stats.totalRequests < 0.7) {
    recommendations.push('Low cache hit rate. Consider increasing cache TTL or using image proxy.');
  }

  if (stats.directRequests > stats.proxyRequests) {
    recommendations.push('Many direct requests detected. Consider routing more images through proxy.');
  }

  if (stats.averageResponseTime > 2000) {
    recommendations.push('Slow response times. Consider optimizing image sizes or using CDN.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Image performance looks good!');
  }

  return recommendations;
}
