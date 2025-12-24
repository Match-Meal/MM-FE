<script setup lang="ts">
import { Wheat, MessageCircle } from 'lucide-vue-next'

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
  <div class="flex-1 flex flex-col bg-primary-50 relative overflow-hidden">
    <!-- Background Circles (Matching SplashView) -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-100/50 blur-3xl animate-float-slow"></div>
      <div class="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl animate-float-delayed"></div>
    </div>

    <div id="screen-login" class="screen flex flex-col h-full p-8 justify-center z-10">
      <!-- Logo & Title Section -->
      <div class="flex flex-col items-center mb-12 animate-fade-in-up">
        <div class="relative mb-6">
          <div
            class="relative w-24 h-24 bg-white text-primary-600 rounded-3xl flex items-center justify-center shadow-float z-10 animate-bounce-subtle"
          >
            <Wheat :size="48" class="text-primary-600" />
          </div>
          <!-- Ripple Effect -->
          <div class="absolute inset-0 bg-primary-400 rounded-xl animate-ping opacity-20"></div>
        </div>
        <h1 class="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Match<span class="text-primary-600">Meal</span>
        </h1>
        <p class="text-slate-500 font-medium tracking-wide">건강한 식단의 시작</p>
      </div>

      <div class="w-full space-y-4">
        <!-- 구글 로그인 버튼 -->
        <button
          @click="handleGoogleLogin"
          class="w-full h-14 bg-white border border-gray-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98] animate-fade-in-up delay-[200ms]"
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
          class="w-full h-14 btn-kakao rounded-2xl font-bold flex items-center justify-center gap-3 relative shadow-sm hover:opacity-95 transition-all active:scale-[0.98] animate-fade-in-up delay-[400ms]"
        >
          <MessageCircle :size="20" fill="currentColor" />
          카카오로 시작하기
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-kakao {
  background-color: #fee500;
  color: rgba(0, 0, 0, 0.85);
  border: none;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-float-slow {
  animation: float 8s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 10s ease-in-out infinite reverse;
}

.animate-bounce-subtle {
  animation: bounceSubtle 2s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Shadow Utility matching SplashView */
.shadow-float {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04), 0 4px 10px rgba(0, 0, 0, 0.02);
}

.delay-\[200ms\] {
  animation-delay: 200ms;
}

.delay-\[400ms\] {
  animation-delay: 400ms;
}
</style>
