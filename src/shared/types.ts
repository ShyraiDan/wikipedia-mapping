export enum PageAccess {
  AllAccess = 'all-access',
  Desktop = 'desktop',
  MobileApp = 'mobile-app',
  MobileWeb = 'mobile-web',
}

export enum PageAgent {
  AllAgents = 'all-agents',
  User = 'user',
  Spider = 'spider',
  Automated = 'automated',
}

export enum PageGranularity {
  Daily = 'daily',
  Monthly = 'monthly',
}

export interface PageDataParams {
  location: string
  access: PageAccess
  agent: PageAgent
  article: string
  granularity: PageGranularity
  start: number // In format YYYYMMDDHH
  end: number // In format YYYYMMDDHH
}

export interface PageviewItem {
  project: string
  access: string
  agent: string
  granularity: string
  timestamp: string
  views: number
}

export interface PageviewsResponse {
  items: PageviewItem[]
}

export interface PageviewsAnalysis {
  pointCount: number
  totalViews: number
  averageViews: number
  first: { timestamp: string; period: string; views: number }
  last: { timestamp: string; period: string; views: number }
  peak: { timestamp: string; period: string; views: number }
  trend: 'rising' | 'falling' | 'stable'
  estimatedChangePercent: number
  trendFitPercent: number
  volatilityPercent: number
  confidence: 'low' | 'moderate' | 'high'
  confidenceScore: number
}
