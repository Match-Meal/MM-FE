import apiClient from './apiClient'

// Helper for streaming requests
// Assuming the backend is at the same origin or proxy is set up.
// If apiClient has a baseURL, we should use it.
// Since I can't easily access axios instance config without importing it,
// I will assume the `apiClient.defaults.baseURL` or just use relative paths if it's a proxy.
// However, usually `apiClient` handles Auth tokens. I need to get the token.
// I'll grab the token from localStorage or store if possible.
import { useAuthStore } from '@/stores/auth'

const getAuthHeader = () => {
  const authStore = useAuthStore()
  return authStore.token ? `Bearer ${authStore.token}` : ''
}

const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
}

// Common streaming fetcher
const streamRequest = async (
  url: string,
  body: unknown,
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  const token = getAuthHeader()
  const baseURL = getBaseUrl()
  const endpoint = url.startsWith('/') ? url : `/${url}`
  const fullUrl = `${baseURL}${endpoint}`

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || response.statusText)
    }

    const reader = response.body?.getReader()
    if (!reader) return ''

    const decoder = new TextDecoder()
    let result = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      result += chunk
      if (onChunk) onChunk(chunk)
    }

    return result
  } catch (e) {
    console.error('Stream request failed', e)
    throw e
  }
}

// DTO Types for Diet API
// (Removed local interfaces and getDietPeriod in favor of dietService)

export interface AiResponse {
  result?: string // For feedback/recommendation (plain string)

  // For history items
  aiType?: 'FEEDBACK' | 'RECOMMENDATION' | 'CHAT'
  question?: string
  answer?: string
  date?: string
  createdAt?: string
}

// Helper to construct UserProfile from AuthStore
const getUserProfile = () => {
  const authStore = useAuthStore()
  const u = authStore.user
  if (!u) return null

  // Simple Age Calc
  let age = 30
  if (u.birthDate) {
    try {
      const year = parseInt(u.birthDate.substring(0, 4))
      age = new Date().getFullYear() - year
    } catch (e) {
      console.warn('Invalid birthdate', e)
    }
  }

  // BMI Calc
  let bmi = 0
  let bmiStatus = 'Unknown'
  if (u.heightCm && u.weightKg) {
    bmi = u.weightKg / (u.heightCm / 100) ** 2
    if (bmi < 18.5) bmiStatus = '저체중'
    else if (bmi < 23) bmiStatus = '정상'
    else if (bmi < 25) bmiStatus = '과체중'
    else bmiStatus = '비만'
  }

  // Convert Array to String for backend
  const allergyStr = Array.isArray(u.allergies) ? u.allergies.join(', ') : u.allergies || '없음'
  const diseaseStr = Array.isArray(u.diseases) ? u.diseases.join(', ') : u.diseases || '없음'

  return {
    user_id: u.id,
    name: u.userName,
    age: age,
    gender: u.gender === 'M' ? 'MALE' : 'FEMALE',
    height_cm: u.heightCm || 170.0,
    weight_kg: u.weightKg || 60.0,
    bmi: parseFloat(bmi.toFixed(1)),
    bmi_status: bmiStatus,
    allergies: allergyStr,
    diseases: diseaseStr,
  }
}

// NOTE: Endpoint names updated to match main.py expectation
import {
  getDietListByPeriod,
  getDietDetail,
  type DailyDietResponseItem,
  type DietDetailItem, // Added import
} from '@/services/dietService'

// NOTE: Endpoint names updated to match main.py expectation
export const getPeriodFeedback = async (
  startDate: string,
  endDate: string,
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  // 1. Fetch Real Diet Data from MM-BE
  let diets: DailyDietResponseItem[] = []
  try {
    diets = await getDietListByPeriod(startDate, endDate)
  } catch (e) {
    console.error('Failed to fetch diet period', e)
  }

  // 1.5 Enrich data if details are missing (similar to ChallengeDetailView logic)
  if (diets.length > 0) {
    const enrichmentPromises = diets.map(async (d) => {
      // Check both standard 'details' and fallback 'dietDetails' (if API returns it inconsistency)
      const details = d.details || (d as unknown as { dietDetails: DietDetailItem[] }).dietDetails
      const hasDetails = details && details.length > 0

      if (!hasDetails && d.dietId) {
        try {
          const detailRes = await getDietDetail(d.dietId)
          return detailRes.data // This should have full details
        } catch (e) {
          console.warn(`Failed to fetch detail for diet ${d.dietId}`, e)
          return d // Fallback to original
        }
      }
      return d
    })
    diets = await Promise.all(enrichmentPromises)
  }

  // 2. Aggregate Data
  let totalCal = 0
  let totalSod = 0
  let totalSug = 0
  const menuList: string[] = []

  diets.forEach((d) => {
    totalCal += d.totalCalories || 0
    totalSod += d.totalSodium || 0
    totalSug += d.totalSugars || 0

    const details = d.details || (d as unknown as { dietDetails: DietDetailItem[] }).dietDetails
    if (details) {
      details.forEach((item: DietDetailItem) => {
        if (item.foodName) menuList.push(item.foodName)
      })
    }
  })

  const recordedMeals = diets.length

  // Calculate period days
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  const avgCal = totalDays > 0 ? totalCal / totalDays : 0

  return streamRequest(
    '/ai/period-feedback',
    {
      period_info: {
        start_date: startDate,
        end_date: endDate,
        recorded_meals: recordedMeals,
        total_days: totalDays,
      },
      nutrition_stats: {
        avg_calories: avgCal,
        total_sodium: totalSod,
        total_sugar: totalSug,
      },
      menu_list: menuList,
      user_profile: getUserProfile(),
    },
    onChunk,
  )
}

export interface IntakeSummary {
  calories: number
  sodium: number
  sugar: number
}

export const getMenuRecommendation = async (
  mealType: string,
  flavors: string[] = [],
  currentIntake: IntakeSummary | null = null,
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  // Use snake_case for meal_type to match RecommendRequest DTO
  return streamRequest(
    '/ai/recommend',
    {
      meal_type: mealType,
      flavors,
      user_profile: getUserProfile(),
      current_intake: currentIntake,
    },
    onChunk,
  )
}

export const chatWithAi = async (
  message: string,
  persona: string = 'coach',
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  return streamRequest(
    '/ai/chat',
    { message, persona, user_profile: getUserProfile(), history: [] },
    onChunk,
  )
}

export const getAiHistory = async (userId: number): Promise<AiResponse[]> => {
  const response = await apiClient.get(`/ai/history/${userId}`)
  return response.data.data
}

export const getPeriodMealPlan = async (
  startDate: string,
  endDate: string,
  flavors: string[] = [],
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  // Use nested period_info to match MealPlanRequest DTO
  return streamRequest(
    '/ai/meal-plan',
    {
      period_info: {
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        recorded_meals: 0,
      },
      flavors,
      user_profile: getUserProfile(),
    },
    onChunk,
  )
}
