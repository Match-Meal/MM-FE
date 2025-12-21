<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, type User } from '@/stores/auth'
import apiClient from '@/services/apiClient'
import UserInfoModal from '@/components/UserInfoModal.vue'
import FollowListModal, { type FollowUser } from '@/components/FollowListModal.vue'
import PostListModal from '@/components/PostListModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { getPosts, type PostListItem, type PostUser } from '@/services/communityService'
import { useToastStore } from '@/stores/toast'
import BottomNav from '@/components/common/BottomNav.vue'

interface ApiFollowerDto {
  userId: number
  userName: string
  profileImage: string
  isFollowing: boolean
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const targetUserId = Number(route.params.id)

// User 인터페이스를 확장하여 화면 전용 타입 정의
interface UserProfileResponse extends User {
  isFollowing: boolean
}

const user = ref<UserProfileResponse | null>(null)
const isLoading = ref(true)
const isFollowing = ref(false)

// 모달 관련 상태
const isModalOpen = ref(false)
const modalTitle = ref('')
const modalList = ref<FollowUser[]>([])

// 유저 정보 모달 관련
const isUserInfoModalOpen = ref(false)
const selectedUser = ref<PostUser | null>(null)

// 게시글 관련 상태
const targetUserPosts = ref<PostListItem[]>([])
const isPostModalOpen = ref(false)

// 언팔로우 확인 모달
const isConfirmOpen = ref(false)

onMounted(async () => {
  // 내 프로필이면 리다이렉트
  if (authStore.user && authStore.user.id === targetUserId) {
    router.replace('/profile')
    return
  }
  await fetchUserProfile()
})

// 게시글 목록 조회
const fetchTargetUserPosts = async (userName: string) => {
  try {
    const response = await getPosts({
      page: 0,
      size: 20,
      searchType: 'WRITER',
      keyword: userName,
      sortType: 'LATEST',
    })
    targetUserPosts.value = response.content
  } catch (e) {
    console.error('게시글 조회 실패', e)
  }
}

const openPostModal = () => {
  isPostModalOpen.value = true
}

// 팔로우 모달 열기
const openFollowModal = async (type: 'follower' | 'following') => {
  modalTitle.value = type === 'follower' ? '팔로워 목록' : '팔로잉 목록'
  isModalOpen.value = true

  try {
    let response
    // 타인 프로필이므로 targetUserId 사용
    if (type === 'follower') {
      response = await apiClient.get(`/user/${targetUserId}/followers`)
    } else {
      response = await apiClient.get(`/user/${targetUserId}/followings`)
    }

    const list = response.data.data || []

    modalList.value = list.map((u: ApiFollowerDto) => ({
      userId: u.userId,
      userName: u.userName,
      profileImage: u.profileImage,
      isFollowing: u.isFollowing,
    }))
  } catch (error) {
    console.error('팔로우 목록 조회 실패:', error)
    toastStore.show('팔로우 목록을 불러오지 못했습니다.', 'error')
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

// 모달 내 팔로우 토글
const handleModalFollowToggle = async (targetUser: FollowUser) => {
  const index = modalList.value.findIndex((u) => u.userId === targetUser.userId)
  if (index === -1) return

  const userItem = modalList.value[index]
  if (!userItem) return

  const originalState = userItem.isFollowing
  const originalFollowingCount = authStore.user?.followingCount || 0

  // 낙관적 업데이트
  userItem.isFollowing = !originalState

  // 내 팔로잉 숫자 업데이트 (authStore)
  if (authStore.user) {
    if (userItem.isFollowing) {
      authStore.user.followingCount = (authStore.user.followingCount || 0) + 1
    } else {
      authStore.user.followingCount = Math.max(0, (authStore.user.followingCount || 0) - 1)
    }
  }

  // 만약 현재 보고 있는 프로필 유저를 리스트에서 팔로우/언팔로우 했다면 메인 버튼 상태도 동기화
  if (targetUser.userId === targetUserId) {
    isFollowing.value = userItem.isFollowing
    // 팔로워 숫자도 같이 조정
    if (user.value) {
      if (isFollowing.value) {
        user.value.followerCount = (user.value.followerCount || 0) + 1
      } else {
        user.value.followerCount = Math.max(0, (user.value.followerCount || 0) - 1)
      }
    }
  }

  try {
    const response = await apiClient.post(`/user/${targetUser.userId}/follow`)
    const result = response.data.data

    if (result) {
      if (result.isFollowing !== undefined) {
        userItem.isFollowing = result.isFollowing
        // 메인 버튼 동기화 (재확인)
        if (targetUser.userId === targetUserId) {
          isFollowing.value = result.isFollowing
        }
      }
      if (typeof result.myFollowingCount === 'number' && authStore.user) {
        authStore.user.followingCount = result.myFollowingCount
      }
    }
  } catch (e) {
    console.error('Follow toggle error:', e)
    userItem.isFollowing = originalState
    if (authStore.user) {
      authStore.user.followingCount = originalFollowingCount
    }
    // 메인 버튼 롤백
    if (targetUser.userId === targetUserId) {
      isFollowing.value = originalState
    }
    toastStore.show('요청 처리에 실패했습니다.', 'error')
  }
}

const fetchUserProfile = async () => {
  try {
    isLoading.value = true
    const response = await apiClient.get(`/user/${targetUserId}`)
    const data = response.data.data
    user.value = data

    // API가 isFollowing을 주지만, 정확성을 위해 내 팔로잉 목록에서 재확인
    if (authStore.user) {
      await checkFollowStatus()
    } else {
      isFollowing.value = !!data.isFollowing
    }

    // 유저 정보 로드 후 게시글 조회
    if (user.value?.userName) {
      await fetchTargetUserPosts(user.value.userName)
    }
  } catch (error) {
    console.error('유저 정보 조회 실패:', error)
    toastStore.show('존재하지 않거나 조회할 수 없는 유저입니다.', 'error')
    router.back()
  } finally {
    isLoading.value = false
  }
}

// [추가] 팔로잉 상태 확실하게 체크
const checkFollowStatus = async () => {
  if (!authStore.user) return
  try {
    const response = await apiClient.get(`/user/${authStore.user.id}/followings`)
    const list = response.data.data || []
    const found = list.find((u: ApiFollowerDto) => u.userId === targetUserId)
    isFollowing.value = !!found
  } catch (e) {
    console.error('Follow check failed', e)
  }
}

// [핵심] 팔로우 토글 핸들러 (메인 프로필 버튼)
const handleFollow = async () => {
  // 1. 로그인 상태 체크 (authStore 활용)
  if (!authStore.isAuthenticated || !authStore.user) {
    if (confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
      router.push('/login')
    }
    return
  }

  // 2. 데이터 방어 코드
  if (!user.value) return

  // [수정] 언팔로우 시 확인 모달 띄우기
  if (isFollowing.value) {
    isConfirmOpen.value = true
    return
  }

  // 팔로우 실행 (언팔로우 아님)
  await processFollowToggle()
}

// 언팔로우 확인 후 실행
const confirmUnfollow = async () => {
  isConfirmOpen.value = false
  await processFollowToggle()
}

// 실제 API 호출 로직 분리
const processFollowToggle = async () => {
  if (!user.value) return

  // 3. 낙관적 업데이트 (UI 먼저 즉시 반영)
  const previousState = isFollowing.value
  const previousFollowerCount = user.value.followerCount || 0
  const previousMyFollowingCount = authStore.user?.followingCount || 0

  isFollowing.value = !isFollowing.value

  if (isFollowing.value) {
    user.value.followerCount = previousFollowerCount + 1
    if (authStore.user) authStore.user.followingCount = previousMyFollowingCount + 1
  } else {
    user.value.followerCount = Math.max(0, previousFollowerCount - 1)
    if (authStore.user) authStore.user.followingCount = Math.max(0, previousMyFollowingCount - 1)
  }

  // 4. API 호출
  try {
    const response = await apiClient.post(`/user/${targetUserId}/follow`)
    const result = response.data.data

    // 결과 반영
    if (result) {
      if (result.isFollowing !== undefined) {
        isFollowing.value = result.isFollowing
      }
      if (typeof result.myFollowingCount === 'number' && authStore.user) {
        authStore.user.followingCount = result.myFollowingCount
      }
    }
  } catch (error) {
    console.error('Follow failed', error)
    // 실패 시 롤백
    isFollowing.value = previousState
    if (user.value) {
      user.value.followerCount = previousFollowerCount
    }
    if (authStore.user) authStore.user.followingCount = previousMyFollowingCount
    toastStore.show('요청 처리에 실패했습니다.', 'error')
  }
}

// ... (BMI 계산 로직 등은 기존과 동일) ...
const isPublicProfile = computed(() => {
  if (!user.value) return false
  return typeof user.value.heightCm === 'number' && typeof user.value.weightKg === 'number'
})

const bmi = computed(() => {
  const u = user.value
  if (!u || !u.heightCm || !u.weightKg) return 0
  const heightM = u.heightCm / 100
  return parseFloat((u.weightKg / (heightM * heightM)).toFixed(1))
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

const goBack = () => router.back()
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate text-gray-800">{{ user?.userName || '프로필' }}</h1>
        <div class="w-8"></div>
      </header>

      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <main v-else class="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide pb-6">
        <div class="bg-white pb-8 rounded-b-[2.5rem] shadow-sm mb-4">
          <div class="flex flex-col items-center pt-8">
            <div class="w-32 h-32 relative mb-4">
              <div
                class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-inner"
              >
                <img
                  v-if="user?.profileImage"
                  :src="user.profileImage"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-5xl">😎</span>
              </div>
            </div>

            <h2 class="text-2xl font-bold mb-1 text-gray-800 flex items-center gap-1">
              {{ user?.userName }}
              <span v-if="user?.gender === 'M'" class="text-sm">👨</span>
              <span v-else-if="user?.gender === 'F'" class="text-sm">👩</span>
            </h2>
            <p class="text-sm text-gray-500 mb-4 px-6 text-center break-keep leading-relaxed">
              {{ user?.statusMessage || '상태 메시지가 없습니다.' }}
            </p>

            <button
              @click="handleFollow"
              class="mb-6 px-8 py-2 rounded-full font-bold text-sm transition shadow-md active:scale-95"
              :class="
                isFollowing
                  ? 'bg-gray-100 text-gray-600 border border-gray-300'
                  : 'bg-blue-600 text-white'
              "
            >
              {{ isFollowing ? '언팔로우' : '팔로우' }}
            </button>

            <div class="flex gap-8 text-center w-full justify-center">
              <div class="cursor-pointer hover:opacity-60 transition" @click="openPostModal">
                <span class="block font-bold text-xl text-gray-800">{{
                  user?.postCount || 0
                }}</span>
                <span class="text-xs text-gray-400">게시글</span>
              </div>
              <div class="w-[1px] h-8 bg-gray-200"></div>

              <div
                class="cursor-pointer hover:opacity-60 transition"
                @click="openFollowModal('follower')"
              >
                <span class="block font-bold text-xl text-gray-800">{{
                  user?.followerCount || 0
                }}</span>
                <span class="text-xs text-gray-400">팔로워</span>
              </div>
              <div class="w-[1px] h-8 bg-gray-200"></div>

              <div
                class="cursor-pointer hover:opacity-60 transition"
                @click="openFollowModal('following')"
              >
                <span class="block font-bold text-xl text-gray-800">{{
                  user?.followingCount || 0
                }}</span>
                <span class="text-xs text-gray-400">팔로잉</span>
              </div>
            </div>
          </div>
        </div>

        <template v-if="isPublicProfile">
          <!-- ... (BMI 및 건강 정보 등 기존 코드 유지) ... -->
          <div class="px-4 mb-4 animate-fade-in">
            <!-- ... -->
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div class="flex justify-between items-end mb-3">
                <div>
                  <h3 class="font-bold text-gray-700 text-sm mb-1">BMI 지수</h3>
                  <div class="flex items-center gap-2">
                    <span class="text-3xl font-extrabold text-gray-800">{{ bmi }}</span>
                    <span
                      class="text-xs font-bold px-2 py-1 rounded bg-gray-50 border border-gray-200"
                      :class="bmiInfo.text"
                      >{{ bmiInfo.label }}</span
                    >
                  </div>
                </div>
                <span class="text-xs text-gray-400 mb-1"
                  >{{ user?.heightCm }}cm / {{ user?.weightKg }}kg</span
                >
              </div>
              <div class="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :class="bmiInfo.color"
                  :style="{ width: `${bmiPercent}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="px-4 space-y-4 animate-fade-in">
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-gray-700 text-sm mb-3">🚫 알레르기 / 기피 음식</h3>
              <div v-if="user?.allergies?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in user.allergies"
                  :key="tag"
                  class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-100"
                  >{{ tag }}</span
                >
              </div>
              <p v-else class="text-xs text-gray-400">등록된 정보가 없습니다.</p>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-gray-700 text-sm mb-3">🏥 건강 고민</h3>
              <div v-if="user?.diseases?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in user.diseases"
                  :key="tag"
                  class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold border border-blue-100"
                  >{{ tag }}</span
                >
              </div>
              <p v-else class="text-xs text-gray-400">등록된 정보가 없습니다.</p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="px-4 mt-8 flex flex-col items-center justify-center text-gray-400 py-10">
            <div
              class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl"
            >
              🔒
            </div>
            <p class="font-bold text-gray-500">비공개 프로필입니다.</p>
            <p class="text-xs mt-1">팔로우를 요청해보세요!</p>
          </div>
        </template>
      </main>

      <BottomNav />

      <!-- 모달 컴포넌트 -->
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

      <!-- 포스트 모달 (PostListModal이 있다고 가정) -->
      <PostListModal
        :is-open="isPostModalOpen"
        :title="`${user?.userName}님의 게시글`"
        :post-list="targetUserPosts"
        @close="isPostModalOpen = false"
      />

      <!-- 언팔로우 확인 모달 -->
      <ConfirmModal
        :is-open="isConfirmOpen"
        title="팔로우 취소"
        :message="`${user?.userName || '사용자'}님을 팔로우 취소하시겠습니까?`"
        confirm-text="언팔로우"
        cancel-text="취소"
        @close="isConfirmOpen = false"
        @confirm="confirmUnfollow"
      />
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일 유지 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
