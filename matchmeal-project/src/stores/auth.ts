import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

interface User {
  id: number
  email: string
  userName: string
  role: string
  picture?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  // 1. 토큰 저장 액션
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('accessToken', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  // 2. 로그아웃 액션
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    delete axios.defaults.headers.common['Authorization']
    window.location.href = '/login'
  }

  // 내 정보 가져오기 (백엔드 API)
  async function fetchUser() {
    if (!token.value) return

    try {
        // 백엔드 UserController (/user/me) 호출
        const response = await axios.get('http://localhost:8080/user/me', {
            headers: { Authorization: `Bearer ${token.value}`}
        })
        user.value = response.data
    } catch (error) {
        console.error('Failed to fetch user', error)
        logout() // 토큰 만료 시 로그아웃
    }
  }

  return { token, user, isAuthenticated, setToken, logout, fetchUser }
})