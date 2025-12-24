import apiClient from './apiClient'
import type { AxiosResponse } from 'axios'

export interface KakaoReadyResponse {
  tid: string
  next_redirect_pc_url: string
  next_redirect_mobile_url: string
  next_redirect_app_url: string
  android_app_scheme: string
  ios_app_scheme: string
  created_at: string
}

export const paymentService = {
  // 1. 결제 준비 요청 (Ready)
  async ready(): Promise<KakaoReadyResponse> {
    const response: AxiosResponse<KakaoReadyResponse> = await apiClient.post('/payment/ready')
    return response.data
  },

  // 2. 결제 승인 요청 (Approve) - 백엔드에서 처리 후 결과 반환
  async approve(pgToken: string, userId: number): Promise<string> {
    const response = await apiClient.get('/payment/success', {
      params: { pg_token: pgToken, userId },
    })
    return response.data.data // "구독이 완료되었습니다!" 메시지 혹은 CommonResponse 구조에 따라 조정
  },

  // 3. 구독 해지 요청
  async cancel(): Promise<string> {
    const response = await apiClient.post('/payment/cancel')
    return response.data.data
  },

  // 4. 내 구독 정보 조회
  async getMySubscription(): Promise<{
    status: string
    nextBillingDate: string | null
    itemName: string | null
    amount: number | null
  }> {
    const response = await apiClient.get('/payment/my-subscription')
    return response.data.data
  },

  // 5. 구독 재활성화 (취소 번복)
  async reactivate(): Promise<string> {
    const response = await apiClient.post('/payment/reactivate')
    return response.data.data
  },
}
