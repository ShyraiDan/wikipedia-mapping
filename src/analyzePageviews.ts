import {
  formatPageviewPeriod,
  PageGranularity,
  type PageDataParams,
  type PageviewItem,
  type PageviewsAnalysis,
} from './shared/index.js'

const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const calculateLinearTrend = (items: PageviewItem[]): { slope: number; fit: number } => {
  const xMean = (items.length - 1) / 2
  const yMean = items.reduce((sum, item) => sum + item.views, 0) / items.length
  const numerator = items.reduce((sum, item, index) => sum + (index - xMean) * (item.views - yMean), 0)
  const xVariance = items.reduce((sum, _, index) => sum + (index - xMean) ** 2, 0)
  const yVariance = items.reduce((sum, item) => sum + (item.views - yMean) ** 2, 0)
  const slope = xVariance === 0 ? 0 : numerator / xVariance
  const fit = xVariance === 0 || yVariance === 0 ? 0 : numerator ** 2 / (xVariance * yVariance)
  return { slope, fit }
}

const getConfidence = (
  pointCount: number,
  trendFit: number,
): Pick<PageviewsAnalysis, 'confidence' | 'confidenceScore'> => {
  const sampleScore = Math.min(pointCount / 12, 1)
  const confidenceScore = round((sampleScore * 0.3 + trendFit * 0.7) * 100)
  const confidence = confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'moderate' : 'low'
  return { confidence, confidenceScore }
}

export const analyzePageviews = (items: PageviewItem[], granularity: PageGranularity): PageviewsAnalysis => {
  if (items.length === 0) {
    throw new Error('Wikimedia returned no pageview items')
  }

  const totalViews = items.reduce((sum, item) => sum + item.views, 0)
  const averageViews = totalViews / items.length
  const variance = items.reduce((sum, item) => sum + (item.views - averageViews) ** 2, 0) / items.length
  const volatilityPercent = averageViews === 0 ? 0 : (Math.sqrt(variance) / averageViews) * 100
  const linearTrend = calculateLinearTrend(items)
  const estimatedChangePercent =
    averageViews === 0 ? 0 : (linearTrend.slope * Math.max(items.length - 1, 1) * 100) / averageViews
  const trend = estimatedChangePercent > 5 ? 'rising' : estimatedChangePercent < -5 ? 'falling' : 'stable'
  const peak = items.reduce((highest, item) => (item.views > highest.views ? item : highest))

  return {
    pointCount: items.length,
    totalViews,
    averageViews: round(averageViews),
    first: {
      timestamp: items[0].timestamp,
      period: formatPageviewPeriod(items[0].timestamp, granularity),
      views: items[0].views,
    },
    last: {
      timestamp: items.at(-1)!.timestamp,
      period: formatPageviewPeriod(items.at(-1)!.timestamp, granularity),
      views: items.at(-1)!.views,
    },
    peak: {
      timestamp: peak.timestamp,
      period: formatPageviewPeriod(peak.timestamp, granularity),
      views: peak.views,
    },
    trend,
    estimatedChangePercent: round(estimatedChangePercent, 1),
    trendFitPercent: round(linearTrend.fit * 100, 1),
    volatilityPercent: round(volatilityPercent, 1),
    ...getConfidence(items.length, linearTrend.fit),
  }
}

export const buildAnalysisDescription = (params: PageDataParams, analysis: PageviewsAnalysis): string => {
  const direction =
    analysis.trend === 'stable'
      ? 'is broadly stable'
      : `shows a ${analysis.trend} linear trend with an estimated change of ${Math.abs(analysis.estimatedChangePercent)}%`

  return [
    `"${params.article}" on ${params.location} has ${analysis.pointCount} ${params.granularity === PageGranularity.Monthly ? 'monthly' : 'daily'} observations, totaling ${analysis.totalViews.toLocaleString('en-US')} views and averaging ${analysis.averageViews.toLocaleString('en-US')} per period.`,
    `Views changed from ${analysis.first.views.toLocaleString('en-US')} in ${analysis.first.period} to ${analysis.last.views.toLocaleString('en-US')} in ${analysis.last.period}; the series ${direction}, while the peak reached ${analysis.peak.views.toLocaleString('en-US')} in ${analysis.peak.period}.`,
    `Confidence in the direction is ${analysis.confidence} (${analysis.confidenceScore}/100): the linear trend explains ${analysis.trendFitPercent}% of the variation across observations, while relative volatility is ${analysis.volatilityPercent}%; short-lived events or a single exceptional peak may still distort the pattern.`,
  ].join(' ')
}
