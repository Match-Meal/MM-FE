<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import { useChallengeStore } from '@/stores/challenge' // 챌린지 스토어
import { useConfirmStore } from '@/stores/confirm' // Added
import { useRouter } from 'vue-router'
import { getDailyDiets } from '@/services/dietService'
import dayjs from 'dayjs'
import BottomNav from '@/components/common/BottomNav.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()
const challengeStore = useChallengeStore()
const confirmStore = useConfirmStore() // Added
const router = useRouter()

const todayCalories = ref(0)
const targetCalories = ref(2000)

// 목표 수정 모달 상태
const showTargetModal = ref(false)
const editingTarget = ref(2000)

onMounted(async () => {
  // 유저 정보 로드
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  // 로컬 스토리지에서 목표 칼로리 불러오기
  const savedTarget = localStorage.getItem('targetCalories')
  if (savedTarget) {
    targetCalories.value = Number(savedTarget)
  }

  // 데이터 로드 병렬 처리 (오늘 칼로리 + 내 챌린지 목록)
  await Promise.all([
    fetchTodayCalories(),
    // [Safe Check] store method exist?
    challengeStore.fetchMyChallenges().then(() => {
      if (challengeStore.updateAllMyChallengesProgress) {
        challengeStore.updateAllMyChallengesProgress()
      }
    }),
  ])
})

const fetchTodayCalories = async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const response = await getDailyDiets(today)

    // totalCalories 계산
    if (Array.isArray(response)) {
      todayCalories.value = response.reduce((acc, cur) => acc + (cur.totalCalories || 0), 0)
    } else if (response && typeof response.totalCalories === 'number') {
      todayCalories.value = response.totalCalories
    } else {
      todayCalories.value = 0
    }
  } catch (e) {
    console.error('Failed to fetch today calories:', e)
  }
}

const editTargetCalories = () => {
  editingTarget.value = targetCalories.value
  showTargetModal.value = true
}

const closeTargetModal = () => {
  showTargetModal.value = false
}

const saveTargetCalories = () => {
  if (editingTarget.value > 0) {
    targetCalories.value = editingTarget.value
    localStorage.setItem('targetCalories', editingTarget.value.toString())
    closeTargetModal()
  } else {
    toastStore.show('올바른 숫자를 입력해주세요.', 'warning')
  }
}

// 로그아웃 처리
const handleLogout = async () => {
  if (await confirmStore.show('로그아웃 하시겠습니까?')) {
    authStore.logout()
    router.replace('/login')
  }
}

// [Added] 챌린지 대시보드 통계
import { computed } from 'vue'

const averageProgress = computed(() => {
  if (challengeStore.myChallenges.length === 0) return 0
  const total = challengeStore.myChallenges.reduce((acc, c) => acc + c.progressPercent, 0)
  return Math.round(total / challengeStore.myChallenges.length)
})

const totalSuccessCount = computed(() => {
  return challengeStore.myChallenges.reduce((acc, c) => acc + c.currentCount, 0)
})

const maxStreak = computed(() => {
  if (challengeStore.myChallenges.length === 0) return 0
  return Math.max(...challengeStore.myChallenges.map((c) => c.currentStreak))
})
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <div class="flex-1 overflow-y-auto scrollbar-hide bg-gray-50 pb-6">
        <div class="bg-blue-600 p-6 pb-10 text-white rounded-b-[2rem] shadow-md transition-all">
          <div class="flex justify-between items-start mb-6">
            <div>
              <span class="font-bold text-lg block">
                👋 안녕하세요, {{ authStore.user?.userName || '회원' }}님
              </span>

              <div
                v-if="authStore.user?.statusMessage"
                class="mt-2 inline-block bg-blue-700/50 px-3 py-1 rounded-full text-xs text-blue-100 border border-blue-500/30"
              >
                📢 "{{ authStore.user?.statusMessage }}"
              </div>
              <div v-else class="mt-2 text-xs text-blue-200 opacity-70">
                오늘도 건강한 하루 보내세요!
              </div>
            </div>

            <button
              @click="handleLogout"
              class="text-xs bg-blue-700/50 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition border border-blue-500/30"
            >
              로그아웃
            </button>
          </div>

          <div class="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
            <div class="flex justify-between items-center mb-1">
              <p class="text-sm opacity-80">오늘의 목표 칼로리</p>
              <button
                @click="editTargetCalories"
                class="text-xs bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition"
              >
                목표 수정
              </button>
            </div>

            <div class="flex justify-between items-end mb-2">
              <span class="text-3xl font-bold">{{
                Math.round(todayCalories).toLocaleString()
              }}</span>
              <span class="text-sm opacity-80 mb-1"
                >/ {{ targetCalories.toLocaleString() }} kcal</span
              >
            </div>
            <div class="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-500"
                :style="{ width: Math.min((todayCalories / targetCalories) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="px-6 -mt-8 mb-6 relative z-10">
          <div class="grid grid-cols-3 gap-3">
            <div
              @click="router.push('/diet')"
              class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition active:scale-95"
            >
              <span class="text-2xl bg-orange-100 p-2 rounded-full">🍽️</span>
              <span class="font-bold text-xs text-gray-700">식단 기록</span>
            </div>
            <div
              @click="router.push('/ai-chatbot')"
              class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition active:scale-95"
            >
              <span class="text-2xl bg-blue-100 p-2 rounded-full">🤖</span>
              <span class="font-bold text-xs text-gray-700">AI 영양사</span>
            </div>
            <div
              @click="router.push('/food-db')"
              class="bg-white p-3 py-4 rounded-2xl shadow-md flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.02] transition active:scale-95"
            >
              <span class="text-2xl bg-green-100 p-2 rounded-full">🍎</span>
              <span class="font-bold text-xs text-gray-700">음식 사전</span>
            </div>
          </div>
        </div>

        <div class="px-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-gray-800 text-lg">🔥 진행 중인 챌린지</h3>
            <span
              @click="router.push('/challenge')"
              class="text-xs text-gray-400 cursor-pointer hover:text-blue-500"
            >
              더보기 >
            </span>
          </div>

          <!-- Statistics Dashboard -->
          <div v-if="challengeStore.myChallenges.length > 0" class="grid grid-cols-2 gap-3">
            <!-- Active Count -->
            <div
              class="bg-blue-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 border border-blue-100 shadow-sm"
            >
              <span class="text-xs text-blue-500 font-bold">진행 중</span>
              <span class="text-2xl font-black text-blue-600">{{
                challengeStore.myChallenges.length
              }}</span>
              <span class="text-[10px] text-blue-400">개의 챌린지</span>
            </div>

            <!-- Avg Progress -->
            <div
              class="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 border border-orange-100 shadow-sm"
            >
              <span class="text-xs text-orange-500 font-bold">평균 달성률</span>
              <span class="text-2xl font-black text-orange-600">{{ averageProgress }}%</span>
              <span class="text-[10px] text-orange-400">꾸준히 하고 있어요!</span>
            </div>

            <!-- Total Success -->
            <div
              class="bg-green-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 border border-green-100 shadow-sm"
            >
              <span class="text-xs text-green-500 font-bold">총 성공 횟수</span>
              <span class="text-2xl font-black text-green-600">{{ totalSuccessCount }}</span>
              <span class="text-[10px] text-green-400">회 완료</span>
            </div>

            <!-- Max Streak -->
            <div
              class="bg-purple-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 border border-purple-100 shadow-sm"
            >
              <span class="text-xs text-purple-500 font-bold">최장 연속</span>
              <span class="text-2xl font-black text-purple-600">{{ maxStreak }}</span>
              <span class="text-[10px] text-purple-400">일 불태웠어요 🔥</span>
            </div>
          </div>

          <div
            v-else
            @click="router.push('/challenge')"
            class="bg-white border border-dashed border-gray-300 p-6 rounded-2xl text-center cursor-pointer hover:bg-gray-50 transition"
          >
            <p class="text-sm text-gray-400 mb-1">아직 참여 중인 챌린지가 없어요</p>
            <span class="text-blue-500 font-bold text-xs">새로운 도전 시작하기 →</span>
          </div>
        </div>
      </div>

      <BottomNav />

      <div
        v-if="showTargetModal"
        class="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
      >
        <div class="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-up">
          <h3 class="text-xl font-bold text-gray-800 mb-2">목표 칼로리 설정</h3>
          <p class="text-sm text-gray-500 mb-6">하루 섭취 목표 칼로리를 입력해주세요.</p>

          <div class="mb-6 relative">
            <input
              type="number"
              v-model.number="editingTarget"
              class="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 text-center text-2xl font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition"
              placeholder="2000"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
              >kcal</span
            >
          </div>

          <div class="flex gap-3">
            <button
              @click="closeTargetModal"
              class="flex-1 h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              @click="saveTargetCalories"
              class="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
