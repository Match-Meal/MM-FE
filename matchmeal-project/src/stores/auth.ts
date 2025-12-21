import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { authService } from '@/services/authService'

export interface User {
  id: number
  socialId: string
  email: string
  userName: string
  role: string
  createdAt: string

  statusMessage?: string
  profileImage?: string
  gender?: 'M' | 'F'
  birthDate?: string
  heightCm?: number
  weightKg?: number
  isPublic?: boolean

  // 팔로우 통계
  followerCount?: number
  followingCount?: number

  postCount?: number

  allergies: string[]
  diseases: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  axios.interceptors.request.use(
    (config) => {
      const currentToken = localStorage.getItem('accessToken')
      if (currentToken) {
        config.headers.Authorization = `Bearer ${token.value}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // 1. 토큰 저장 액션
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('accessToken', newToken)
  }

  // 2. 로그아웃 액션
  async function logout() {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (e) {
      console.error('Logout failed on server', e)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
  }

  // 3. 회원 탈퇴 액션
  async function withdraw() {
    try {
      await authService.withdraw()
      logout() // 탈퇴 성공 시 로그아웃 처리
    } catch (e) {
      console.error('Withdraw failed', e)
      throw e
    }
  }

  // 4. 계정 복구 액션
  async function reactivate() {
    try {
      // 복구 요청 후 새로운 토큰 수신 (백엔드가 accessToken을 반환한다고 가정)
      const response = await authService.reactivate()

      // 응답 구조에 따라 수정 필요: response.data.data.accessToken 등
      // CommonResponse 구조를 따른다고 가정
      const newUserToken = response.data.data?.accessToken

      // 만약 토큰이 왔다면 갱신
      if (newUserToken) {
        setToken(newUserToken)
      }

      // 복구 후 정보 갱신
      await fetchUser()
    } catch (e) {
      console.error('Reactivation failed', e)
      throw e
    }
  }

  // 내 정보 가져오기 (백엔드 API)
  async function fetchUser() {
    try {
      // 백엔드 UserController (/user/me) 호출
      // 백엔드 UserController (/user/me) 호출
      const response = await axios.get<{ data: User }>('http://localhost:8080/user/me')
      user.value = response.data.data
    } catch (error) {
      console.error('Failed to fetch user', error)
      logout() // 토큰 만료 시 로그아웃
    }
  }

  return { token, user, isAuthenticated, setToken, logout, fetchUser, withdraw, reactivate }
})
