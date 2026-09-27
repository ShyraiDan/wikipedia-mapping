import {
  isEnumValue,
  isLastDayOfMonth,
  PageAccess,
  PageAgent,
  PageGranularity,
  readRelativeMonthlyRange,
  requireTimestamp,
  type PageDataParams,
} from './shared/index.js'

export interface CliParamValues {
  location?: string
  access?: string
  agent?: string
  article?: string
  granularity?: string
  start?: string
  end?: string
  months?: string
}

const requireText = (value: string | undefined, flag: string): string => {
  const text = value?.trim() ?? ''
  if (!text) {
    throw new Error(`Missing --${flag}`)
  }
  return text
}

export const readParams = (values: CliParamValues): PageDataParams => {
  const location = requireText(values.location, 'location')
  const access = requireText(values.access, 'access')
  const agent = requireText(values.agent, 'agent')
  const article = requireText(values.article, 'article')
  const granularity = requireText(values.granularity, 'granularity')

  if (!isEnumValue(access, PageAccess)) {
    throw new Error('Invalid --access: expected all-access, desktop, mobile-app, or mobile-web')
  }
  if (!isEnumValue(agent, PageAgent)) {
    throw new Error('Invalid --agent: expected all-agents, user, spider, or automated')
  }
  if (!isEnumValue(granularity, PageGranularity)) {
    throw new Error('Invalid --granularity: expected daily or monthly')
  }

  const hasExplicitRange = values.start !== undefined || values.end !== undefined
  if (values.months !== undefined && hasExplicitRange) {
    throw new Error('Pass either --months or both --start and --end, not both')
  }
  if (values.months !== undefined && granularity !== PageGranularity.Monthly) {
    throw new Error('--months is only supported with monthly granularity')
  }

  const range =
    values.months !== undefined
      ? readRelativeMonthlyRange(values.months)
      : {
          start: requireTimestamp(values.start, 'start'),
          end: requireTimestamp(values.end, 'end'),
        }
  const { start, end } = range

  if (start > end) {
    throw new Error('Invalid range: start is after end')
  }
  if (granularity === PageGranularity.Monthly && String(start).slice(6, 8) !== '01') {
    throw new Error('Invalid monthly range: --start must be the first day of a month')
  }
  if (granularity === PageGranularity.Monthly && !isLastDayOfMonth(end)) {
    throw new Error('Invalid monthly range: --end must be the last day of a month to avoid partial data')
  }

  return { location, access, agent, article, granularity, start, end }
}
