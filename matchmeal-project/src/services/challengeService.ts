import apiClient from '@/services/apiClient' // 작성하신 axios 인스턴스 import 경로에 맞춰주세요 (예: utils/axios 등)

// API URL (apiClient의 baseURL이 '/api'라고 가정하므로 '/challenge'만 작성)
const API_URL = '/challenge'

// --- [Type Definitions] ---

// 1. 챌린지 생성 요청 DTO (백엔드 ChallengeCreateRequestDto와 일치)
export interface ChallengeCreateRequest {
  title: string
  description: string
  type: 'CALORIE_LIMIT' | 'RECORD_FREQUENCY' | 'TIME_RANGE'
  targetValue: number
  startDate: string
  endDate: string
  goalCount: number
  maxParticipants: number
  isPublic: boolean
}

// 2. 응답 데이터 타입
export interface ChallengeResponse {
  challengeId: number
  title: string
  description: string
  type: 'CALORIE_LIMIT' | 'RECORD_FREQUENCY' | 'TIME_RANGE'
  targetValue: number
  startDate: string
  endDate: string
  goalCount: number
  isJoined: boolean
  currentHeadCount: number
  maxParticipants: number
  status?: string
  progressPercent: number
  currentCount: number
  currentStreak: number
}

// 3. 검색 조건 타입
export interface SearchCondition {
  type?: string
  keyword?: string
  startDate?: string
  endDate?: string
}

// --- [API Functions] ---

// 챌린지 생성 (POST)
export const createChallenge = async (data: ChallengeCreateRequest) => {
  // CommonResponse<Long> 형태이므로 data.data가 challengeId
  const response = await apiClient.post<{ data: number }>(API_URL, data)
  return response.data.data
}

// 내 챌린지 조회 (GET)
export const getMyChallenges = async () => {
  const response = await apiClient.get<{ data: ChallengeResponse[] }>(`${API_URL}`)
  return response.data.data
}

// 전체 챌린지 검색 (GET)
export const searchChallenges = async (params: SearchCondition) => {
  const response = await apiClient.get<{ data: ChallengeResponse[] }>(`${API_URL}/search`, {
    params,
  })
  return response.data.data
}

// 공개 챌린지 참여 (POST)
export const joinChallenge = async (challengeId: number) => {
  return await apiClient.post(`${API_URL}/${challengeId}/join`)
}

// 비공개 챌린지 코드로 참여 (POST)
export const joinByCode = async (code: string) => {
  // Query Parameter로 code 전달
  return await apiClient.post(`${API_URL}/join/code`, null, {
    params: { code },
  })
}
