import apiClient from './apiClient'

export interface CommonResponse<T> {
  status: number
  message: string
  data: T
}

export interface DietFoodItem {
  foodId?: number
  foodName: string
  quantity: number
  unit: string
  calories: number
  carbohydrate: number
  protein: number
  fat: number
  sugars?: number
  sodium?: number
}

export interface CreateDietPayload {
  eatDate: string // YYYY-MM-DD
  eatTime: string // HH:mm
  mealType: string // BREAKFAST, LUNCH, DINNER, SNACK
  memo?: string
  foods: DietFoodItem[]
}

export interface DietDetailItem extends DietFoodItem {
  dietDetailId: number
}

export interface DailyDietResponseItem {
  dietId: number
  eatDate: string
  eatTime: string
  mealType: string
  memo: string
  totalCalories: number
  totalCarbohydrate: number
  totalProtein: number
  totalFat: number
  totalSugars?: number
  totalSodium?: number
  dietImgUrl?: string // Changed from imageUrl based on API response
  details: DietDetailItem[]
}

export interface DailyDietListResponse {
  date: string
  totalCalories: number
  diets: DailyDietResponseItem[]
}

export type DailyDietListResult = DailyDietListResponse | DailyDietResponseItem[]

// 식단 목록(일별) 조회
export const getDailyDiets = async (
  date: string,
  userId?: number,
): Promise<DailyDietListResult> => {
  try {
    const params: any = { date }
    if (userId) params.userId = userId

    const response = await apiClient.get('/diet', { params })
    return response.data.data
  } catch (error) {
    console.error('Error fetching daily diets:', error)
    throw error
  }
}

// 식단 상세 조회
export const getDietDetail = async (dietId: number): Promise<{ data: DailyDietResponseItem }> => {
  try {
    const response = await apiClient.get(`/diet/${dietId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching diet detail for ${dietId}:`, error)
    throw error
  }
}

// 식단 생성
export const createDiet = async (payload: CreateDietPayload, file?: File) => {
  try {
    const formData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    formData.append('data', jsonBlob)

    if (file) {
      formData.append('file', file)
    } else {
      formData.append('file', new Blob(), '')
    }

    const response = await apiClient.post('/diet', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating diet:', error)
    throw error
  }
}

// 식단 수정
export const updateDiet = async (dietId: number, payload: CreateDietPayload, file?: File) => {
  try {
    const formData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    formData.append('data', jsonBlob)

    if (file) {
      formData.append('file', file)
    } else {
      formData.append('file', new Blob(), '')
    }

    const response = await apiClient.put(`/diet/${dietId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error updating diet ${dietId}:`, error)
    throw error
  }
}

// 식단 삭제
export const deleteDiet = async (dietId: number) => {
  try {
    const response = await apiClient.delete(`/diet/${dietId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting diet ${dietId}:`, error)
    throw error
  }
}

// --- 식단 통계 관련 Interfaces ---

export interface CpfRatioAnalysis {
  carbRatio: number
  proteinRatio: number
  fatRatio: number
  recommendedCarbRatio: number
  recommendedProteinRatio: number
  recommendedFatRatio: number
  feedback: string
}

export interface NutrientAnalysis {
  nutrientName: string
  currentIntake: number
  recommendedLimit: number
  intakePercentage: number
  status: 'GOOD' | 'BAD' | 'WARNING'
}

export interface DailyStat {
  date: string
  totalCalories: number
  carbsG: number
  proteinG: number
  fatG: number
  sugarG: number
  sodiumMg: number
  dietScore: number
}

export interface DietStatsResponse {
  periodTotalDays: number
  averageCalories: number
  cpfRatioAnalysis: CpfRatioAnalysis
  sodiumAnalysis: NutrientAnalysis
  sugarAnalysis: NutrientAnalysis
  dailyStats: DailyStat[]
}

// 식단 통계 조회
export const getDietStats = async (
  periodType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
  startDate?: string,
  endDate?: string,
  userId?: number, // [Added]
) => {
  try {
    const params: Record<string, string | number> = { periodType }
    if (periodType === 'CUSTOM' && startDate && endDate) {
      params.startDate = startDate
      params.endDate = endDate
    }
    if (userId) {
      // [Added]
      params.userId = userId
    }

    const response = await apiClient.get<CommonResponse<DietStatsResponse>>('/diet/stats', {
      params,
    })
    return response.data.data
  } catch (error) {
    console.error('Error fetching diet stats:', error)
    throw error
  }
}

// [Updated] 기간별 식단 리스트 조회 (챌린지 기록 확인용)
export const getDietListByPeriod = async (startDate: string, endDate: string, userId?: number) => {
  try {
    const params: any = { startDate, endDate }
    if (userId) params.userId = userId

    const response = await apiClient.get<CommonResponse<DailyDietResponseItem[]>>('/diet/period', {
      params,
    })
    return response.data.data
  } catch (error) {
    console.error('Error fetching diet list by period:', error)
    throw error
  }
}

export interface MatchedFoodItem {
  foodId: number
  foodName: string
  servingSize: number
  unit: string
  calories: number
  carbohydrate: number
  protein: number
  fat: number
  sugars: number
  sodium: number
}

export interface FoodAnalysisResponseDto {
  predictedName: string
  candidates: string[]
  matchedFoods: MatchedFoodItem[]
}

export const analyzeDietImage = async (file: File): Promise<FoodAnalysisResponseDto> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<CommonResponse<FoodAnalysisResponseDto>>(
      '/diet/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data.data
  } catch (error) {
    console.error('Error analyzing diet image:', error)
    // Fallback or rethrow? Rethrow for now.
    throw error
  }
}

export interface MatchedFoodItem {
    foodId: number;
    foodName: string;
    servingSize: number;
    unit: string;
    calories: number;
    carbohydrate: number;
    protein: number;
    fat: number;
    sugars: number;
    sodium: number;
}

export interface FoodAnalysisResponseDto {
    predictedName: string;
    candidates: string[];
    matchedFoods: MatchedFoodItem[];
}

export const analyzeDietImage = async (file: File): Promise<FoodAnalysisResponseDto> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<CommonResponse<FoodAnalysisResponseDto>>('/diet/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error analyzing diet image:', error);
        // Fallback or rethrow? Rethrow for now.
        throw error;
    }
};
