import apiClient from './apiClient'

export interface AiResponse {
  result?: string // For feedback/recommendation (plain string)

  // For history items
  aiType?: 'FEEDBACK' | 'RECOMMENDATION'
  question?: string
  answer?: string
  date?: string
  createdAt?: string
}

export const getPeriodFeedback = async (startDate: string, endDate: string): Promise<string> => {
  const response = await apiClient.post('/ai/feedback', {
    startDate,
    endDate,
  })
  return response.data.data
}

export const getMenuRecommendation = async (mealType: string): Promise<string> => {
  const response = await apiClient.post('/ai/recommend', {
    mealType,
  })
  return response.data.data
}

export const getAiHistory = async (userId: number): Promise<AiResponse[]> => {
  const response = await apiClient.get(`/ai/history/${userId}`)
  return response.data.data
}
