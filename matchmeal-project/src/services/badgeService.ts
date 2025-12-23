import apiClient from './apiClient'

export interface Badge {
  badgeId: number
  name: string
  description: string
  imageUrl: string
  isAcquired: boolean
  currentValue: number
  targetValue: number
  tier: number
}

export type BadgeCategoryMap = Record<string, Badge[]>

export const getMyBadges = async (): Promise<BadgeCategoryMap> => {
  try {
    const response = await apiClient.get('/badges/my')
    // CommonResponse { status, message, data }
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch badges', error)
    return {}
  }
}
