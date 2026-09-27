import { PageGranularity, type PageDataParams } from '../types.js'

export const requireTimestamp = (value: string | undefined, flag: string): number => {
  const text = value?.trim() ?? ''
  if (!/^\d{10}$/.test(text)) {
    throw new Error(`Invalid --${flag}: expected YYYYMMDDHH`)
  }

  const year = Number(text.slice(0, 4))
  const month = Number(text.slice(4, 6))
  const day = Number(text.slice(6, 8))
  const hour = Number(text.slice(8, 10))
  const date = new Date(Date.UTC(year, month - 1, day, hour))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    hour !== 0
  ) {
    throw new Error(`Invalid --${flag}: expected a real date ending in hour 00`)
  }

  return Number(text)
}

export const isLastDayOfMonth = (timestamp: number): boolean => {
  const text = String(timestamp)
  const year = Number(text.slice(0, 4))
  const month = Number(text.slice(4, 6))
  const day = Number(text.slice(6, 8))
  return day === new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export const formatTimestamp = (date: Date): number =>
  Number(
    [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
      '00',
    ].join(''),
  )

export const formatPageviewPeriod = (timestamp: string, granularity: PageGranularity): string => {
  const year = Number(timestamp.slice(0, 4))
  const month = Number(timestamp.slice(4, 6))
  const day = Number(timestamp.slice(6, 8))
  const date = new Date(Date.UTC(year, month - 1, day))
  const options: Intl.DateTimeFormatOptions =
    granularity === PageGranularity.Monthly
      ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export const readRelativeMonthlyRange = (value: string): Pick<PageDataParams, 'start' | 'end'> => {
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error('Invalid --months: expected a positive integer')
  }

  const monthCount = Number(value)
  const now = new Date()
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
  const startDate = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - (monthCount - 1), 1),
  )
  return { start: formatTimestamp(startDate), end: formatTimestamp(endDate) }
}
