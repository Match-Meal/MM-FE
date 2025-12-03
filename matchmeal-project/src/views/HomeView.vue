<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }
})

// 로그아웃 처리
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-gray-100 shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- 상단 헤더 영역 -->
      <div class="bg-blue-600 p-6 pb-10 text-white rounded-b-[2rem] shadow-md">
        <div class="flex justify-between items-center mb-6">
          <!-- 동적 사용자 이름 표시 -->
          <span class="font-bold text-lg">
            👋 안녕하세요, {{ authStore.user?.userName || '회원' }}님
          </span>
          <button
            @click="handleLogout"
            class="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
          >
            로그아웃
          </button>
        </div>

        <div class="bg-white/10 p-5 rounded-2xl backdrop-blur-sm">
          <p class="text-sm opacity-80 mb-1">오늘의 목표 칼로리</p>
          <div class="flex justify-between items-end mb-2">
            <span class="text-3xl font-bold">1,240</span>
            <span class="text-sm opacity-80 mb-1">/ 2,000 kcal</span>
          </div>
          <div class="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div class="h-full bg-green-400 w-[62%] rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- 메인 메뉴 그리드 -->
      <div class="px-6 -mt-8 mb-6">
        <div class="grid grid-cols-3 gap-3">
          <div
            class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition"
          >
            <span class="text-2xl bg-orange-100 p-2 rounded-full">🍽️</span>
            <span class="font-bold text-xs">식단 기록</span>
          </div>
          <div
            class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition"
          >
            <span class="text-2xl bg-blue-100 p-2 rounded-full">🤖</span>
            <span class="font-bold text-xs">AI 영양사</span>
          </div>
          <div
            class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition"
          >
            <span class="text-2xl bg-green-100 p-2 rounded-full">🍎</span>
            <span class="font-bold text-xs">음식 사전</span>
          </div>
        </div>
      </div>

      <!-- 챌린지 섹션 -->
      <div class="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-gray-800">🔥 진행 중인 챌린지</h3>
          <span class="text-xs text-gray-400 cursor-pointer">더보기 ></span>
        </div>
        <div
          class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center"
        >
          <div
            class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl"
          >
            🥗
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-sm">매일 샐러드 먹기</h4>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full">
                <div class="w-[80%] h-full bg-green-500 rounded-full"></div>
              </div>
              <span class="text-xs text-green-600 font-bold">80%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 네비게이션 -->
      <nav
        class="h-[88px] bg-white border-t flex justify-around pb-6 pt-2 text-[10px] z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"
      >
        <div class="nav-item active text-blue-600 font-bold flex flex-col items-center">
          <span class="text-2xl mb-1">🏠</span>홈
        </div>
        <div class="nav-item text-gray-400 flex flex-col items-center">
          <span class="text-2xl mb-1">🍽️</span>식단
        </div>
        <div class="nav-item text-gray-400 flex flex-col items-center">
          <span class="text-2xl mb-1">🔥</span>챌린지
        </div>
        <div class="nav-item text-gray-400 flex flex-col items-center">
          <span class="text-2xl mb-1">💬</span>커뮤니티
        </div>
        <div class="nav-item text-gray-400 flex flex-col items-center">
          <span class="text-2xl mb-1">👤</span>MY
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
