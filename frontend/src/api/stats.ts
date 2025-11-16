import { apiClient } from './client'

export type Period = 'today' | 'week' | 'month'

export interface SummaryStats {
  totalReviewed: number
  totalReviewedToday: number
  totalReviewedThisWeek: number
  totalReviewedThisMonth: number
  approvedPercentage: number
  rejectedPercentage: number
  requestChangesPercentage: number
  averageReviewTime: number
}

export interface ActivityPoint {
  date: string
  approved: number
  rejected: number
  requestChanges: number
}

export interface DecisionsChart {
  approved: number
  rejected: number
  requestChanges: number
}

export type CategoriesChart = Record<string, number>

export async function fetchSummaryStats(signal?: AbortSignal): Promise<SummaryStats> {
  const res = await apiClient.get<SummaryStats>('/stats/summary', { signal })
  return res.data
}

export async function fetchActivityChart(
  period: Period,
  signal?: AbortSignal
): Promise<ActivityPoint[]> {
  const res = await apiClient.get<ActivityPoint[]>('/stats/chart/activity', {
    params: { period },
    signal,
  })
  return res.data
}

export async function fetchDecisionsChart(
  period: Period,
  signal?: AbortSignal
): Promise<DecisionsChart> {
  const res = await apiClient.get<DecisionsChart>('/stats/chart/decisions', {
    params: { period },
    signal,
  })
  return res.data
}

export async function fetchCategoriesChart(
  period: Period,
  signal?: AbortSignal
): Promise<CategoriesChart> {
  const res = await apiClient.get<CategoriesChart>('/stats/chart/categories', {
    params: { period },
    signal,
  })
  return res.data
}
