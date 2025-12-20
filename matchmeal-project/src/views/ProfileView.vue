<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/services/apiClient'
import FollowListModal, { type FollowUser } from '@/components/FollowListModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue'
import PostListModal from '@/components/PostListModal.vue'
import { getPosts, type PostListItem, type PostUser } from '@/services/communityService'

const authStore = useAuthStore()
const router = useRouter()

interface ApiFollowerDto {
  userId: number
  userName: string
  profileImage: string
  isFollowing: boolean
}

// 모달 관련
const isModalOpen = ref(false)
const modalTitle = ref('')
const modalList = ref<FollowUser[]>([])

// 유저 정보 모달 관련
const isUserInfoModalOpen = ref(false)
const selectedUser = ref<PostUser | null>(null)

// 내 게시글 관련
const myPosts = ref<PostListItem[]>([])
const myPostCount = ref(0)
const isPostModalOpen = ref(false)

onMounted(async () => {
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }
  await fetchMyPosts()
})

const fetchMyPosts = async () => {
  if (!authStore.user?.userName) return
  try {
    const response = await getPosts({
      page: 0,
      size: 20, // 모달에서 보여줄 개수 증가
      searchType: 'WRITER',
      keyword: authStore.user.userName,
      sortType: 'LATEST',
    })
    myPosts.value = response.content
    myPostCount.value = response.pageInfo.totalCount
  } catch (e) {
    console.error('Failed to fetch my posts', e)
  }
}

const openPostModal = () => {
  isPostModalOpen.value = true
}

const goToEditProfile = () => router.push('/profile-form')
const goToSettings = () => router.push('/settings')
const navigateTo = (path: string) => router.push(path)

// 팔로우 모달
const openFollowModal = async (type: 'follower' | 'following') => {
  modalTitle.value = type === 'follower' ? '팔로워 목록' : '팔로잉 목록'
  isModalOpen.value = true

  try {
    const userId = authStore.user?.id
    if (!userId) return

    let response

    // apiClient에 baseURL(8080)이 설정되어 있으므로 /user/... 만 쓰면 됨
    if (type === 'follower') {
      response = await apiClient.get(`/user/${userId}/followers`)
    } else {
      response = await apiClient.get(`/user/${userId}/followings`)
    }

    // { status: 200, data: [ ... ] } 형태이므로 .data.data 접근
    const list = response.data.data || []

    // FollowListModal은 'userName'을 원합니다.
    modalList.value = list.map((u: ApiFollowerDto) => ({
      userId: u.userId,
      userName: u.userName,
      profileImage: u.profileImage,
      isFollowing: u.isFollowing,
    }))
  } catch (error) {
    console.error('팔로우 목록 조회 실패:', error)
  }
}

// 유저 정보 모달 열기
const openUserInfoModal = (user: FollowUser) => {
  selectedUser.value = {
    userId: user.userId,
    userName: user.userName,
    profileImage: user.profileImage || '',
  }
  isUserInfoModalOpen.value = true
}

// 리스트 내 팔로우 토글 핸들러
const handleModalFollowToggle = async (targetUser: FollowUser) => {
  // 인덱스 찾기
  const index = modalList.value.findIndex((u) => u.userId === targetUser.userId)

  // 인덱스가 없으면 중단
  if (index === -1) return

  // 이렇게 하면 TypeScript는 userItem이 undefined가 아님을 확신합니다.
  const userItem = modalList.value[index]
  if (!userItem) return

  // 현재 상태 파악
  const originalState = userItem.isFollowing
  const originalFollowingCount = authStore.user?.followingCount || 0

  // 버튼 상태 반전
  userItem.isFollowing = !originalState

  if (authStore.user) {
    if (userItem.isFollowing) {
      // 팔로우 + 1
      authStore.user.followingCount = (authStore.user.followingCount || 0) + 1
    } else {
      // 언팔 -1
      authStore.user.followingCount = Math.max(0, (authStore.user.followingCount || 0) - 1)
    }
  }

  try {
    // 백엔드 API 호출
    const response = await apiClient.post(`/user/${targetUser.userId}/follow`)
    const result = response.data.data

    if (result && authStore.user) {
      if (typeof result.myFollowingCount === 'number') {
        authStore.user.followingCount = result.myFollowingCount
      }
      if (result.isFollowing !== undefined) {
        userItem.isFollowing = result.isFollowing
      }
    }
  } catch (e) {
    console.error('Follow toggle error:', e)
    // 실패 시 롤백
    userItem.isFollowing = originalState
    if (authStore.user) {
      authStore.user.followingCount = originalFollowingCount
    }
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
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="router.back()" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate text-gray-800">내 프로필</h1>
        <div class="w-8"></div>
      </header>
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
              <div class="cursor-pointer hover:opacity-60 transition" @click="openPostModal">
                <span class="block font-bold text-xl text-gray-800">{{ myPostCount }}</span>
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
        :current-user-id="authStore.user?.id"
        @close="isModalOpen = false"
        @toggle="handleModalFollowToggle"
        @click-user="openUserInfoModal"
      />

      <UserInfoModal
        v-if="selectedUser"
        :is-open="isUserInfoModalOpen"
        :user="selectedUser"
        @close="isUserInfoModalOpen = false"
      />

      <!-- 게시글 목록 모달 -->
      <PostListModal
        :is-open="isPostModalOpen"
        title="내가 쓴 게시글"
        :post-list="myPosts"
        @close="isPostModalOpen = false"
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
