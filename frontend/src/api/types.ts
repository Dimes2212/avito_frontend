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
