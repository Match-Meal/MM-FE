<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// 공개 설정 상태 (임시: 실제 백엔드 연동 시 store 값으로 초기화)
const isPublic = ref(true)

onMounted(() => {
  // 백엔드에 isPublic 필드가 있다면 여기서 초기화
  // if (authStore.user) isPublic.value = authStore.user.isPublic
})

const goBack = () => router.back()

const togglePrivacy = async () => {
  const newValue = !isPublic.value
  try {
    // API 호출 (예시)
    // await axios.patch('http://localhost:8080/user/visibility', { isPublic: newValue })
    isPublic.value = newValue
    console.log('공개 설정 변경:', newValue)
  } catch (e) {
    alert('설정 변경 실패')
  }
}

const handleLogout = () => {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    authStore.logout()
    router.replace('/login')
  }
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20">
        <button @click="goBack" class="text-2xl w-8 text-gray-600 hover:text-gray-900 transition">
          ←
        </button>
        <h1 class="font-bold text-lg text-gray-800">설정</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto bg-white scrollbar-hide">
        <div class="py-2">
          <h3 class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
            계정 설정
          </h3>

          <div class="p-4 px-6 flex justify-between items-center border-b border-gray-50">
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700 mb-0.5">프로필 공개</span>
              <span class="text-xs text-gray-400">{{
                isPublic ? '모든 사람이 볼 수 있어요' : '나만 볼 수 있어요'
              }}</span>
            </div>
            <div
              @click="togglePrivacy"
              class="w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300"
              :class="isPublic ? 'bg-blue-500' : 'bg-gray-300'"
            >
              <div
                class="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                :class="isPublic ? 'translate-x-5' : 'translate-x-0'"
              ></div>
            </div>
          </div>

          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">내 뱃지 컬렉션 🏆</span>
            <span class="text-gray-300">›</span>
          </div>
        </div>

        <div class="py-2">
          <h3 class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
            앱 정보
          </h3>
          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">공지사항</span>
            <span class="text-gray-300">›</span>
          </div>
          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">버전 정보</span>
            <span class="text-xs text-gray-400">v1.0.0</span>
          </div>
        </div>

        <div class="p-6 mt-4">
          <button
            @click="handleLogout"
            class="w-full py-4 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition"
          >
            로그아웃
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
