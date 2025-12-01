<script setup lang="ts">
// 구글 로그인 시작 URL (백엔드 SecurityConfig 설정과 일치)
const GOOGLE_LOGIN_URL = 'http://localhost:8080/oauth2/authorization/google'

const handleGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <!-- 모바일 프레임 -->
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <div id="screen-login" class="screen flex flex-col h-full p-8 justify-center bg-white">
        <div class="flex flex-col items-center mb-10">
           <div class="w-24 h-24 bg-blue-600 text-white rounded-3xl mb-6 flex items-center justify-center text-5xl shadow-lg transform rotate-3">🥗</div>
           <h1 class="text-3xl font-bold text-gray-800 mb-2">MatchMeal</h1>
           <p class="text-gray-500">AI 식단 분석부터 챌린지까지</p>
        </div>

        <h2 class="text-xl font-bold mb-6 text-center text-gray-700">간편 로그인</h2>
        
        <div class="w-full space-y-4">
          <!-- 구글 로그인 버튼 (실제 작동) -->
          <button 
            @click="handleGoogleLogin" 
            class="w-full h-14 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition"
          >
            <span class="text-xl">🇬</span> 구글로 시작하기
          </button>

          <!-- 카카오 (디자인용 Placeholder) -->
          <button class="w-full h-14 btn-kakao rounded-lg font-bold flex items-center justify-center gap-3 relative shadow-sm opacity-50 cursor-not-allowed">
            <span class="text-xl">💬</span> 카카오로 시작하기 (준비중)
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.btn-kakao { background-color: #FEE500; color: #000000 85%; border: none; }

</style>