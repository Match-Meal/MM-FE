import apiClient from './apiClient'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface ReissueResponse {
  accessToken: string
  refreshToken: string
}

export const authService = {
  // 로그아웃
  logout: async () => {
    // Note: The backend endpoint is /auth/logout according to the prompt
    // It likely requires the Refresh Token header or body if relying on redis deletion by key
    // But usually simple logout just invalidates. Let's send POST /auth/logout
    return apiClient.post('/auth/logout')
  },

  // 토큰 재발급
  reissue: async () => {
    return apiClient.post<ReissueResponse>('/auth/reissue')
  },

  // 회원 탈퇴
  withdraw: async () => {
    return apiClient.delete('/user/withdraw')
  },

  // 계정 복구
  reactivate: async () => {
    return apiClient.post('/user/reactivate', { decision: 'RESTORE' })
  },
}
