<script setup lang="ts">
import { Leaf, MessageCircle } from 'lucide-vue-next'

// 백엔드 URL 및 리다이렉트 URI 설정
const BACKEND_URL = 'http://localhost:8080'
const FRONTEND_URL = 'http://localhost:5173'
const REDIRECT_URI = `${FRONTEND_URL}/oauth/callback`

// 구글/카카오 로그인 시작 URL (redirect_uri 파라미터 포함)
const GOOGLE_LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/google?redirect_uri=${REDIRECT_URI}`
const KAKAO_LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/kakao?redirect_uri=${REDIRECT_URI}`

const handleGoogleLogin = () => {
  window.location.href = GOOGLE_LOGIN_URL
}

const handleKakaoLogin = () => {
  window.location.href = KAKAO_LOGIN_URL
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <!-- 모바일 프레임 -->
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <div id="screen-login" class="screen flex flex-col h-full p-8 justify-center bg-white">
        <div class="flex flex-col items-center mb-12">
          <div
            class="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-3xl mb-6 flex items-center justify-center shadow-lg transform rotate-3"
          >
            <Leaf :size="48" fill="white" />
          </div>
          <h1 class="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">MatchMeal</h1>
          <p class="text-gray-500 font-medium">AI 식단 분석부터 챌린지까지</p>
        </div>



        <div class="w-full space-y-4">
          <!-- 구글 로그인 버튼 (실제 작동) -->
          <button
            @click="handleGoogleLogin"
            class="w-full h-14 bg-white border border-gray-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글로 시작하기
          </button>

          <!-- 카카오 로그인 버튼 -->
          <button
            @click="handleKakaoLogin"
            class="w-full h-14 btn-kakao rounded-2xl font-bold flex items-center justify-center gap-3 relative shadow-sm hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <MessageCircle :size="20" fill="currentColor" />
            카카오로 시작하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-kakao {
  background-color: #fee500;
  color: #000000 85%;
  border: none;
}
</style>
