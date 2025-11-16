import { apiClient } from './client'

export type AdStatus = 'pending' | 'approved' | 'rejected' | 'draft'
export type AdPriority = 'normal' | 'urgent'

export interface Advertisement {
  id: number
  title: string
  description: string
  price: number
  category: string
  categoryId: number
  status: AdStatus
  priority: AdPriority
  createdAt: string
  updatedAt: string
  images: string[]
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export interface AdsListResponse {
  ads: Advertisement[]
  pagination: Pagination
}

export interface AdsListParams {
  page?: number
  limit?: number
}

export async function fetchAds(
  params: AdsListParams = {},
  signal?: AbortSignal
): Promise<AdsListResponse> {
  const response = await apiClient.get<AdsListResponse>('/ads', {
    params,
    signal,
  })

  return response.data
}

export interface Seller {
  id: number
  name: string
  rating: string
  totalAds: number
  registeredAt: string
}

export interface ModerationHistoryItem {
  id: number
  moderatorId: number
  moderatorName: string
  action: 'approved' | 'rejected' | 'requestChanges'
  reason?: string | null
  comment?: string | null
  createdAt: string
}

export interface Advertisement {
  id: number
  title: string
  description: string
  price: number
  category: string
  categoryId: number
  status: 'pending' | 'approved' | 'rejected' | 'draft'
  priority: 'normal' | 'urgent'
  createdAt: string
  updatedAt: string
  images: string[]
  seller: Seller
  characteristics: Record<string, string>
  moderationHistory: ModerationHistoryItem[]
}

// детальное объявление
export async function fetchAdById(id: number, signal?: AbortSignal): Promise<Advertisement> {
  const res = await apiClient.get<Advertisement>(`/ads/${id}`, { signal })
  return res.data
}

export interface ModerationPayload {
  reason: string
  comment?: string
}

// одобрить
export async function approveAd(id: number): Promise<Advertisement> {
  const res = await apiClient.post<{ ad: Advertisement }>(`/ads/${id}/approve`)
  return res.data.ad
}

// отклонить
export async function rejectAd(id: number, payload: ModerationPayload): Promise<Advertisement> {
  const res = await apiClient.post<{ ad: Advertisement }>(`/ads/${id}/reject`, payload)
  return res.data.ad
}

// вернуть на доработку
export async function requestChanges(
  id: number,
  payload: ModerationPayload
): Promise<Advertisement> {
  const res = await apiClient.post<{ ad: Advertisement }>(`/ads/${id}/request-changes`, payload)
  return res.data.ad
}
