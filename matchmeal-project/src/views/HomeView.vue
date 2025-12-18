<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChallengeStore } from '@/stores/challenge' // 챌린지 스토어
import { useRouter } from 'vue-router'
import { getDailyDiets } from '@/services/dietService'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const challengeStore = useChallengeStore()
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
    challengeStore.fetchMyChallenges(), // 내 챌린지 목록 불러오기
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
    alert('올바른 숫자를 입력해주세요.')
  }
}

// 로그아웃 처리
const handleLogout = () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    authStore.logout()
    router.replace('/login')
  }
}

// 챌린지 타입에 따른 아이콘 반환
const getChallengeIcon = (type: string) => {
  switch (type) {
    case 'CALORIE_LIMIT':
      return '🥗'
    case 'TIME_RANGE':
      return '⏰'
    case 'RECORD_FREQUENCY':
      return '📝'
    default:
      return '🔥'
  }
}
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

          <div v-if="challengeStore.myChallenges.length > 0" class="space-y-3">
            <div
              v-for="item in challengeStore.myChallenges.slice(0, 2)"
              :key="item.challengeId"
              @click="router.push('/challenge')"
              class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition group"
            >
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg"
                  >
                    {{ getChallengeIcon(item.type) }}
                  </div>
                  <div>
                    <h4
                      class="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition"
                    >
                      {{ item.title }}
                    </h4>
                    <p class="text-[10px] text-gray-400">
                      {{ item.startDate }} ~ {{ item.endDate }}
                    </p>
                  </div>
                </div>
                <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">
                  {{ item.progressPercent }}%
                </span>
              </div>

              <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-500 rounded-full transition-all duration-500"
                  :style="{ width: `${item.progressPercent}%` }"
                ></div>
              </div>

              <div class="flex justify-between text-[10px] text-gray-400">
                <span>목표: {{ item.goalCount }}회</span>
                <span>연속 {{ item.currentStreak }}일째 🔥</span>
              </div>
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

      <nav
        class="h-[88px] bg-white border-t flex justify-around pb-6 pt-2 text-[10px] z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"
      >
        <div class="nav-item flex flex-col items-center cursor-pointer text-blue-600 font-bold">
          <span class="text-2xl mb-1">🏠</span>홈
        </div>

        <div
          @click="router.push('/diet')"
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">🍽️</span>식단
        </div>

        <div
          @click="router.push('/challenge')"
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">🔥</span>챌린지
        </div>

        <div
          @click="router.push('/community')"
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">💬</span>커뮤니티
        </div>

        <div
          @click="router.push('/profile')"
          class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
        >
          <span class="text-2xl mb-1">👤</span>MY
        </div>
      </nav>

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
