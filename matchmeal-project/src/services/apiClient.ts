import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 1. Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // Vite 프록시 설정과 일치
  headers: {
    'Content-Type': 'application/json',
  },
})

// 2. 요청 인터셉터(interceptor) 설정
apiClient.interceptors.request.use(
  (config) => {
    // 컴포넌트 외부에서 Pinia 스토어 사용
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
