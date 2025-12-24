<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import { useChallengeStore } from '@/stores/challenge'
import { useConfirmStore } from '@/stores/confirm'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { getDailyDiets } from '@/services/dietService'
import dayjs from 'dayjs'
import BottomNav from '@/components/common/BottomNav.vue'
import NotificationDropdown from '@/components/common/NotificationDropdown.vue'
import RankingTicker from '@/components/home/RankingTicker.vue'
import RankingModal from '@/components/home/RankingModal.vue'
import OnboardingModal from '@/components/common/OnboardingModal.vue'
import { useRankingStore } from '@/stores/rankingStore'
import { 
  LogOut, 
  Edit3, 
  Utensils, 
  Bot, 
  Apple, 
  ChevronRight, 
  Trophy, 
  Activity, 
  CheckCircle2, 
  Flame, 
  PlusCircle, 
  X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const toastStore = useToastStore()
const challengeStore = useChallengeStore()
const confirmStore = useConfirmStore()
const notificationStore = useNotificationStore()
const rankingStore = useRankingStore()
const router = useRouter()

const todayCalories = ref(0)
const targetCalories = ref(2000)

// 목표 수정 모달 상태
const showTargetModal = ref(false)
const editingTarget = ref(2000)

// 랭킹 모달 상태
const showRankingModal = ref(false)
// 온보딩 모달 상태
const showOnboarding = ref(false)

const checkOnboarding = () => {
  const userId = authStore.user?.id || 'guest'
  const hasSeen = localStorage.getItem(`hasSeenOnboarding_${userId}`)
  console.log('[HomeView] Onboarding Check:', { userId, hasSeen })
  
  if (!hasSeen || hasSeen !== 'true') {
    console.log('[HomeView] Showing Onboarding Modal')
    showOnboarding.value = true
  } else {
    console.log('[HomeView] Onboarding already seen')
  }
}

const handleCloseOnboarding = () => {
  showOnboarding.value = false
  const userId = authStore.user?.id || 'guest'
  localStorage.setItem(`hasSeenOnboarding_${userId}`, 'true')
  console.log('[HomeView] Onboarding Closed & Saved')
}

onMounted(async () => {
  // 유저 정보 로드
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  rankingStore.connect() // 랭킹 웹소켓 연결

  // 알림 초기화
  if (authStore.user) {
    notificationStore.fetchInitialData()
    notificationStore.connect()
  }

  // 로컬 스토리지에서 목표 칼로리 불러오기
  const savedTarget = localStorage.getItem('targetCalories')
  if (savedTarget) {
    targetCalories.value = Number(savedTarget)
  }

  // 온보딩 체크
  checkOnboarding()

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

const isGoalAchieved = computed(() => {
  return targetCalories.value > 0 && todayCalories.value >= targetCalories.value
})

onUnmounted(() => {
  notificationStore.disconnect()
  rankingStore.disconnect()
})
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      id="mobile-frame"
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <div class="flex-1 overflow-y-auto scrollbar-hide bg-slate-50 pb-6">
        <!-- Header Section -->
        <div class="bg-gradient-to-br from-primary-500 to-primary-700 p-6 pb-12 text-white rounded-b-[2.5rem] shadow-lg relative transition-all duration-500 custom-card">
            <!-- Background Decoration Container (Clipped) -->
            <div class="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            </div>
            
          <div class="flex justify-between items-start mb-8 relative z-20">
            <div class="flex items-center gap-2">
              <div class="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Utensils :size="24" class="text-white" />
              </div>
              <span class="font-extrabold text-2xl tracking-tight text-white">
                Match Meal
              </span>
            </div>

            <div class="flex items-center gap-2">
              <NotificationDropdown />
              <button
                @click="handleLogout"
                class="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-sm"
              >
                <LogOut :size="18" />
              </button>
            </div>
          </div>

          <!-- Calorie Card -->
          <div
            class="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-inner relative z-10 transition-transform duration-500"
            :class="{ 'animate-celebrate-card': isGoalAchieved }"
          >
            <div class="flex justify-between items-center mb-2">
              <p class="text-blue-50 text-sm font-medium">오늘의 섭취량</p>
              <button
                @click="editTargetCalories"
                class="text-xs flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg hover:bg-white/30 transition text-white font-medium"
              >
                <Edit3 :size="12" />
                수정
              </button>
            </div>

            <div class="flex justify-between items-end mb-4">
              <span class="text-4xl font-bold tracking-tight">{{
                Math.round(todayCalories).toLocaleString()
              }}</span>
              <span class="text-sm text-blue-100 mb-1.5 font-medium"
                >/ {{ targetCalories.toLocaleString() }} kcal</span
              >
            </div>
            
            <div class="w-full h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                class="h-full bg-gradient-to-r from-primary-300 to-accent rounded-full shadow-[0_0_15px_rgba(255,229,134,0.4)] transition-all duration-700 ease-out relative"
                :style="{ width: Math.min((todayCalories / targetCalories) * 100, 100) + '%' }"
              >
                <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Actions Grid -->
        <div class="px-6 -mt-8 mb-8 relative z-10">
          <div class="grid grid-cols-3 gap-4">
            <div
              @click="router.push('/diet')"
              class="bg-white p-4 h-32 rounded-[2rem] shadow-[0_8px_20px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-95 group border border-slate-50 relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="w-14 h-14 bg-orange-50 rounded-[1.2rem] flex items-center justify-center group-hover:bg-orange-100 transition-colors text-orange-500 shadow-sm relative z-10">
                <Utensils :size="26" stroke-width="2" />
              </div>
              <span class="font-bold text-xs text-slate-600 group-hover:text-slate-800 relative z-10">식단 기록</span>
            </div>

            <div
              @click="router.push('/ai-chatbot')"
              class="bg-white p-4 h-32 rounded-[2rem] shadow-[0_8px_20px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-95 group border border-slate-50 relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="w-14 h-14 bg-blue-50 rounded-[1.2rem] flex items-center justify-center group-hover:bg-blue-100 transition-colors text-blue-500 shadow-sm relative z-10">
                <Bot :size="26" stroke-width="2" />
              </div>
              <span class="font-bold text-xs text-slate-600 group-hover:text-slate-800 relative z-10">AI 챗봇</span>
            </div>

            <div
              @click="router.push('/food-db')"
              class="bg-white p-4 h-32 rounded-[2rem] shadow-[0_8px_20px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-95 group border border-slate-50 relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="w-14 h-14 bg-green-50 rounded-[1.2rem] flex items-center justify-center group-hover:bg-green-100 transition-colors text-green-500 shadow-sm relative z-10">
                <Apple :size="26" stroke-width="2" />
              </div>
              <span class="font-bold text-xs text-slate-600 group-hover:text-slate-800 relative z-10">음식 사전</span>
            </div>
          </div>
        </div>

        <!-- Ranking Section -->
        <div class="px-6 -mt-4 mb-4 relative z-10">
          <RankingTicker @open="showRankingModal = true" />
        </div>

        <!-- Challenge Section -->
        <div class="px-6 mb-8">
          <div class="flex justify-between items-center mb-5">
            <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Flame :size="20" class="text-orange-500 fill-orange-500" />
                나의 챌린지 기록
            </h3>
            <button
              @click="router.push('/challenge')"
              class="text-xs text-slate-400 flex items-center gap-0.5 hover:text-primary-600 transition bg-slate-100 px-2 py-1 rounded-full"
            >
              전체보기 <ChevronRight :size="12" />
            </button>
          </div>

          <!-- Statistics Dashboard (Bento Style) -->
          <div v-if="challengeStore.myChallenges.length > 0" class="grid grid-cols-2 gap-3">
            <!-- Active Count -->
            <div class="bg-emerald-50/80 p-5 rounded-[1.5rem] flex flex-col items-start justify-between h-28 relative overflow-hidden group">
              <div class="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-2 -translate-y-2">
                <Activity :size="60" />
              </div>
              <span class="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                <Activity :size="10" /> 진행 중
              </span>
              <div class="flex items-baseline gap-1 z-10">
                <span class="text-3xl font-black text-emerald-800">{{ challengeStore.myChallenges.length }}</span>
                <span class="text-sm text-emerald-600/80 font-medium">개</span>
              </div>
            </div>

            <!-- Avg Progress -->
            <div class="bg-blue-50/80 p-5 rounded-[1.5rem] flex flex-col items-start justify-between h-28 relative overflow-hidden group">
               <div class="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-2 -translate-y-2">
                <Trophy :size="60" />
              </div>
              <span class="text-xs text-blue-600 font-bold flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                <Trophy :size="10" /> 평균 달성
              </span>
              <div class="flex items-baseline gap-1 z-10">
                <span class="text-3xl font-black text-blue-800">{{ averageProgress }}</span>
                <span class="text-sm text-blue-600/80 font-medium">%</span>
              </div>
            </div>

            <!-- Total Success -->
            <div class="bg-indigo-50/80 p-5 rounded-[1.5rem] flex flex-col items-start justify-between h-28 relative overflow-hidden group">
               <div class="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-2 -translate-y-2">
                <CheckCircle2 :size="60" />
              </div>
              <span class="text-xs text-indigo-600 font-bold flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                <CheckCircle2 :size="10" /> 총 성공
              </span>
              <div class="flex items-baseline gap-1 z-10">
                <span class="text-3xl font-black text-indigo-800">{{ totalSuccessCount }}</span>
                <span class="text-sm text-indigo-600/80 font-medium">회</span>
              </div>
            </div>

            <!-- Max Streak -->
            <div class="bg-orange-50/80 p-5 rounded-[1.5rem] flex flex-col items-start justify-between h-28 relative overflow-hidden group">
               <div class="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-2 -translate-y-2">
                <Flame :size="60" />
              </div>
              <span class="text-xs text-orange-600 font-bold flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                <Flame :size="10" /> 최장 연속
              </span>
              <div class="flex items-baseline gap-1 z-10">
                <span class="text-3xl font-black text-orange-800">{{ maxStreak }}</span>
                <span class="text-sm text-orange-600/80 font-medium">일</span>
              </div>
            </div>
          </div>

          <div
            v-else
            @click="router.push('/challenge')"
            class="bg-white border-2 border-dashed border-slate-200 p-8 rounded-[2rem] text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition group"
          >
            <div class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:bg-white group-hover:text-primary-500 transition shadow-sm">
                <PlusCircle :size="28" />
            </div>
            <p class="text-sm text-slate-500 font-medium mb-1">참여 중인 챌린지가 없어요</p>
            <span class="text-primary-600 font-bold text-xs bg-primary-50 px-3 py-1 rounded-full mt-2 inline-block">새로운 도전 시작하기</span>
          </div>
        </div>
      </div>

      <BottomNav />
      


      <!-- Edit Modal -->
      <div
        v-if="showTargetModal"
        class="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
      >
        <div class="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scale-up relative">
          <button @click="closeTargetModal" class="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition">
            <X :size="24" />
          </button>
          
          <h3 class="text-xl font-bold text-slate-800 mb-2">목표 칼로리 설정</h3>
          <p class="text-sm text-gray-500 mb-8">하루 섭취 목표 칼로리를 입력해주세요.</p>

          <div class="mb-8 relative">
            <input
              type="number"
              v-model.number="editingTarget"
              class="w-full h-16 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 text-center text-3xl font-bold focus:outline-none focus:border-primary-500 focus:bg-white transition text-slate-800 placeholder:text-gray-300"
              placeholder="2000"
            />
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
              >kcal</span
            >
          </div>

          <button
            @click="saveTargetCalories"
            class="w-full h-14 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
          >
            저장하기
          </button>
        </div>
      </div>

      <!-- Ranking Modal (Absolute positioned in phone frame) -->
      <RankingModal :show="showRankingModal" @close="showRankingModal = false" />
      
      <!-- Onboarding Modal -->
      <OnboardingModal 
        :is-open="showOnboarding" 
        @close="handleCloseOnboarding" 
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
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

.animate-celebrate-card {
  animation: celebrateCard 2s infinite ease-in-out;
}

@keyframes celebrateCard {
  0% {
    transform: scale(1);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Original shadow-lg */
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(251, 191, 36, 0.3); /* Golden Glow */
  }
  100% {
    transform: scale(1);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}
</style>
