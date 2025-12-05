<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }
})

const goToEditProfile = () => router.push('/profile-form')
const goToSettings = () => router.push('/settings')
const navigateTo = (path: string) => router.push(path)

// BMI 계산 로직
const bmi = computed(() => {
  const h = authStore.user?.heightCm
  const w = authStore.user?.weightKg
  if (!h || !w) return 0
  const heightM = h / 100
  return parseFloat((w / (heightM * heightM)).toFixed(1))
})

const bmiInfo = computed(() => {
  const val = bmi.value
  if (val === 0) return { label: '정보 없음', color: 'bg-gray-300', text: 'text-gray-400' }
  if (val < 18.5) return { label: '저체중', color: 'bg-blue-500', text: 'text-blue-600' }
  if (val < 23) return { label: '정상', color: 'bg-green-500', text: 'text-green-600' }
  if (val < 25) return { label: '비만 전단계', color: 'bg-orange-500', text: 'text-orange-600' }
  return { label: '비만', color: 'bg-red-500', text: 'text-red-600' }
})

const bmiPercent = computed(() => {
  const val = bmi.value
  if (!val) return 0
  const min = 10,
    max = 35
  const percent = ((val - min) / (max - min)) * 100
  return Math.min(100, Math.max(0, percent))
})
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <main class="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide pb-6">
        <div class="bg-white pb-8 rounded-b-[2.5rem] shadow-sm mb-4">
          <div class="flex flex-col items-center pt-8">
            <div class="w-32 h-32 relative mb-4">
              <div
                class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-inner cursor-pointer overflow-hidden"
                @click="goToEditProfile"
              >
                😎
              </div>

              <button
                @click.stop="goToSettings"
                class="absolute bottom-0 left-0 w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-gray-50 transition active:scale-90"
              >
                ⚙️
              </button>

              <button
                @click.stop="goToEditProfile"
                class="absolute bottom-0 right-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md border border-white hover:bg-black transition active:scale-90"
              >
                ✏️
              </button>
            </div>

            <h2 class="text-2xl font-bold mb-1 text-gray-800">
              {{ authStore.user?.userName || '회원' }}
            </h2>
            <p class="text-sm text-gray-500 mb-6 px-6 text-center break-keep leading-relaxed">
              {{ authStore.user?.statusMessage || '오늘도 건강한 하루 되세요! 🌱' }}
            </p>

            <div class="flex gap-8 text-center w-full justify-center">
              <div>
                <span class="block font-bold text-xl text-gray-800">15</span
                ><span class="text-xs text-gray-400">게시글</span>
              </div>
              <div class="w-[1px] h-8 bg-gray-200"></div>
              <div>
                <span class="block font-bold text-xl text-gray-800">240</span
                ><span class="text-xs text-gray-400">팔로워</span>
              </div>
              <div class="w-[1px] h-8 bg-gray-200"></div>
              <div>
                <span class="block font-bold text-xl text-gray-800">180</span
                ><span class="text-xs text-gray-400">팔로잉</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 mb-4">
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div class="flex justify-between items-end mb-3">
              <div>
                <h3 class="font-bold text-gray-700 text-sm mb-1">나의 BMI 지수</h3>
                <div class="flex items-center gap-2">
                  <span class="text-3xl font-extrabold text-gray-800">{{ bmi }}</span>
                  <span
                    class="text-xs font-bold px-2 py-1 rounded bg-gray-50 border border-gray-200"
                    :class="bmiInfo.text"
                  >
                    {{ bmiInfo.label }}
                  </span>
                </div>
              </div>
              <span class="text-xs text-gray-400 mb-1">
                {{ authStore.user?.heightCm || 0 }}cm / {{ authStore.user?.weightKg || 0 }}kg
              </span>
            </div>
            <div class="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="bmiInfo.color"
                :style="{ width: `${bmiPercent}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
              <span>저체중</span><span>정상</span><span>비만</span>
            </div>
          </div>
        </div>

        <div class="px-4 space-y-4">
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"
          >
            <span class="font-bold text-gray-700 text-sm">🎂 생년월일</span>
            <span class="text-gray-500 text-sm font-medium">{{
              authStore.user?.birthDate || '미입력'
            }}</span>
          </div>

          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="font-bold text-gray-700 text-sm mb-3">🚫 알레르기 / 기피 음식</h3>
            <div v-if="authStore.user?.allergies?.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in authStore.user.allergies"
                :key="tag"
                class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-100"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="text-xs text-gray-400">등록된 정보가 없습니다.</p>
          </div>

          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="font-bold text-gray-700 text-sm mb-3">🏥 건강 고민 / 질병</h3>
            <div v-if="authStore.user?.diseases?.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in authStore.user.diseases"
                :key="tag"
                class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold border border-blue-100"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="text-xs text-gray-400">등록된 정보가 없습니다.</p>
          </div>
        </div>
      </main>

      <nav
        class="h-[88px] bg-white border-t flex justify-around pb-6 pt-2 text-[10px] z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"
      >
        <div
          @click="navigateTo('/home')"
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">🏠</span>홈
        </div>
        <div
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">🍽️</span>식단
        </div>
        <div
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">🔥</span>챌린지
        </div>
        <div
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">💬</span>커뮤니티
        </div>
        <div class="nav-item flex flex-col items-center cursor-pointer text-blue-600 font-bold">
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
