<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FollowListModal, { type FollowUser } from '@/components/FollowListModal.vue'

const authStore = useAuthStore()
const router = useRouter()

// 모달 관련
const isModalOpen = ref(false)
const modalTitle = ref('')
const modalList = ref<FollowUser[]>([])

onMounted(async () => {
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }
})

const goToEditProfile = () => router.push('/profile-form')
const goToSettings = () => router.push('/settings')
const navigateTo = (path: string) => router.push(path)

// 팔로우 모달
const openFollowModal = async (type: 'follower' | 'following') => {
  if (!authStore.user) return

  modalTitle.value = type === 'follower' ? '팔로워 목록' : '팔로잉 목록'
  const endpoint = type === 'follower' ? 'followers' : 'followings'

  try {
    // 목록 조회 API
    const response = await axios.get(`http://localhost:8080/user/${authStore.user.id}/${endpoint}`)
    modalList.value = response.data
    isModalOpen.value = true
  } catch (e) {
    console.error('팔로우 목록 조회 실패:', e)
    alert('목록을 불러오지 못했습니다.')
  }
}

// 리스트 내 팔로우 토글 핸들러
const handleModalFollowToggle = async (targetUser: FollowUser) => {
  // 낙관적 업데이트 (UI 먼저 변경)
  const originalState = targetUser.isFollowing
  targetUser.isFollowing = !originalState

  try {
    // 백엔드 api 호출 (post / user/{targetId}/follow)
    // 응답값: FollowResponseDto { isFollowing, followerCount, followingCount }
    const response = await axios.post(`http://localhost:8080/user/${targetUser.userId}/follow`)

    // 서버 응답값으로 UI 정합성 맞추기
    if (response.data) {
      // 팔로잉 숫자 갱신
      if (authStore.user && typeof response.data.myFollowingCount === 'number') {
        authStore.user.followingCount = response.data.myFollowingCount
      }

      // 대상 유저의 상태 업데이트
      targetUser.isFollowing = response.data.isFollowing
    }
  } catch (e) {
    console.error('Follow toggle error:', e)
    // 실패 시 롤백
    targetUser.isFollowing = originalState
    alert('요청 처리에 실패했습니다.')
  }
}

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
              <!-- 프로필 이미지 표시 -->
              <div
                class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-inner cursor-pointer"
                @click="goToEditProfile"
              >
                <!-- 이미지가 있으면 이미지 표시, 없으면 이모지 -->
                <img
                  v-if="authStore.user?.profileImage"
                  :src="authStore.user.profileImage"
                  class="w-full h-full object-cover"
                  alt="Profile"
                />
                <span v-else class="text-5xl">😎</span>
              </div>

              <!-- 설정 버튼 -->
              <button
                @click.stop="goToSettings"
                class="absolute bottom-0 left-0 w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-gray-50 transition active:scale-90"
              >
                ⚙️
              </button>

              <!-- 수정 버튼 -->
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

            <!-- 통계 및 클릭 이벤트 -->
            <div class="flex gap-8 text-center w-full justify-center">
              <div>
                <span class="block font-bold text-xl text-gray-800">0</span>
                <span class="text-xs text-gray-400">게시글</span>
              </div>
              <div class="w-[1px] h-8 bg-gray-200"></div>

              <!-- 팔로워 (클릭 시 모달 오픈) -->
              <div
                class="cursor-pointer hover:opacity-60 transition"
                @click="openFollowModal('follower')"
              >
                <span class="block font-bold text-xl text-gray-800">
                  {{ authStore.user?.followerCount || 0 }}
                </span>
                <span class="text-xs text-gray-400">팔로워</span>
              </div>

              <div class="w-[1px] h-8 bg-gray-200"></div>

              <!-- 팔로잉 (클릭 시 모달 오픈) -->
              <div
                class="cursor-pointer hover:opacity-60 transition"
                @click="openFollowModal('following')"
              >
                <span class="block font-bold text-xl text-gray-800">
                  {{ authStore.user?.followingCount || 0 }}
                </span>
                <span class="text-xs text-gray-400">팔로잉</span>
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

      <!-- 모달 컴포넌트 사용 -->
      <FollowListModal
        :is-open="isModalOpen"
        :title="modalTitle"
        :user-list="modalList"
        @close="isModalOpen = false"
        @toggle="handleModalFollowToggle"
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
