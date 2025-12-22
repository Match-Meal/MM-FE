<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'
import apiClient from '@/services/apiClient'
import FollowListModal, { type FollowUser } from '@/components/FollowListModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue'
import PostListModal from '@/components/PostListModal.vue'
import { getPosts, type PostListItem, type PostUser } from '@/services/communityService'
import BottomNav from '@/components/common/BottomNav.vue'
import {
  ArrowLeft,
  Settings,
  Edit2,
  User as UserIcon,
  FileText,
  Users,
  UserPlus,
  Scale,
  Ruler,
  Stethoscope,
  Cake,
  UtensilsCrossed,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const toastStore = useToastStore()
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
    toastStore.show('요청 처리에 실패했습니다.', 'error')
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
  if (val === 0) return { label: '정보 없음', color: 'bg-slate-200', text: 'text-slate-400' }
  if (val < 18.5) return { label: '저체중', color: 'bg-blue-500', text: 'text-blue-600' }
  if (val < 23) return { label: '정상', color: 'bg-emerald-500', text: 'text-emerald-600' }
  if (val < 25) return { label: '비만 전단계', color: 'bg-amber-500', text: 'text-amber-600' }
  return { label: '비만', color: 'bg-rose-500', text: 'text-rose-600' }
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
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <header
        class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0"
      >
        <button
          @click="router.back()"
          class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">내 프로필</h1>
        <div class="w-8"></div>
      </header>
      <main class="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide pb-6">
        <div class="bg-white pb-8 rounded-b-[2.5rem] shadow-sm mb-4">
          <div class="flex flex-col items-center pt-8">
            <div class="w-32 h-32 relative mb-4">
              <!-- 프로필 이미지 표시 -->
              <div
                class="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-inner cursor-pointer"
                @click="goToEditProfile"
              >
                <!-- 이미지가 있으면 이미지 표시, 없으면 이모지 -->
                <img
                  v-if="authStore.user?.profileImage"
                  :src="authStore.user.profileImage"
                  class="w-full h-full object-cover"
                  alt="Profile"
                />
                <UserIcon v-else :size="64" class="text-slate-300" />
              </div>

              <!-- 설정 버튼 -->
              <button
                @click.stop="goToSettings"
                class="absolute bottom-0 left-0 w-10 h-10 bg-white text-slate-600 rounded-full flex items-center justify-center shadow-md border border-slate-100 hover:bg-slate-50 transition active:scale-90"
              >
                <Settings :size="20" />
              </button>

              <!-- 수정 버튼 -->
              <button
                @click.stop="goToEditProfile"
                class="absolute bottom-0 right-0 w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md border border-white hover:bg-black transition active:scale-90"
              >
                <Edit2 :size="18" />
              </button>
            </div>

            <h2 class="text-2xl font-bold mb-1 text-slate-900">
              {{ authStore.user?.userName || '회원' }}
              <!-- 구독자 뱃지 (아이콘 + 텍스트) -->
              <span
                v-if="authStore.user?.role === 'ROLE_SUBSCRIBER'"
                class="ml-2 inline-flex items-center gap-1 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm align-middle"
              >
                PREMIUM
              </span>
            </h2>
            <p
              class="text-sm text-slate-500 mb-6 px-6 text-center break-keep leading-relaxed pb-1 font-medium"
            >
              {{ authStore.user?.statusMessage || '오늘도 건강한 하루 되세요!' }}
            </p>

            <!-- 구독 다음 결제일 표시 -->

            <!-- 통계 및 클릭 이벤트 -->
            <div class="flex gap-8 text-center w-full justify-center">
              <div class="cursor-pointer group" @click="openPostModal">
                <span
                  class="block font-bold text-xl text-slate-800 group-hover:text-primary-600 transition"
                  >{{ myPostCount }}</span
                >
                <span
                  class="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1 group-hover:text-primary-500 transition"
                >
                  <FileText :size="12" /> 게시글
                </span>
              </div>
              <div class="w-[1px] h-10 bg-gray-100"></div>

              <!-- 팔로워 -->
              <div class="cursor-pointer group" @click="openFollowModal('follower')">
                <span
                  class="block font-bold text-xl text-slate-800 group-hover:text-primary-600 transition"
                >
                  {{ authStore.user?.followerCount || 0 }}
                </span>
                <span
                  class="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1 group-hover:text-primary-500 transition"
                >
                  <Users :size="12" /> 팔로워
                </span>
              </div>

              <div class="w-[1px] h-10 bg-gray-100"></div>

              <!-- 팔로잉 -->
              <div class="cursor-pointer group" @click="openFollowModal('following')">
                <span
                  class="block font-bold text-xl text-slate-800 group-hover:text-primary-600 transition"
                >
                  {{ authStore.user?.followingCount || 0 }}
                </span>
                <span
                  class="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1 group-hover:text-primary-500 transition"
                >
                  <UserPlus :size="12" /> 팔로잉
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 mb-4">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div class="flex justify-between items-end mb-4">
              <div>
                <h3 class="font-bold text-slate-700 text-sm mb-1 flex items-center gap-1.5">
                  <Scale :size="16" class="text-primary-500" /> 나의 BMI 지수
                </h3>
                <div class="flex items-center gap-2">
                  <span class="text-3xl font-extrabold text-slate-800 tracking-tight">{{
                    bmi
                  }}</span>
                  <span
                    class="text-xs font-bold px-2.5 py-1 rounded-full border"
                    :class="[bmiInfo.text, 'border-current bg-opacity-10']"
                    :style="{ backgroundColor: bmiInfo.color.replace('bg-', '') }"
                  >
                    {{ bmiInfo.label }}
                  </span>
                </div>
              </div>
              <span
                class="text-xs text-slate-400 mb-1 font-medium bg-slate-50 px-2 py-1 rounded-lg"
              >
                <Ruler :size="12" class="inline mr-1" />
                {{ authStore.user?.heightCm || 0 }}cm / <Scale :size="12" class="inline mx-1" />
                {{ authStore.user?.weightKg || 0 }}kg
              </span>
            </div>
            <div class="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative"
                :class="bmiInfo.color"
                :style="{ width: `${bmiPercent}%` }"
              >
                <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[1px]"></div>
              </div>
            </div>
            <div class="flex justify-between text-[10px] text-gray-400 mt-2 px-1 font-medium">
              <span>저체중</span><span>정상</span><span>비만</span>
            </div>
          </div>
        </div>

        <div class="px-5 space-y-4">
          <div
            class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center"
          >
            <span class="font-bold text-slate-700 text-sm flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"
              >
                <Cake :size="18" />
              </div>
              생년월일
            </span>
            <span class="text-slate-500 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-xl">{{
              authStore.user?.birthDate || '미입력'
            }}</span>
          </div>

          <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
              <UtensilsCrossed :size="18" class="text-rose-500" /> 알레르기 / 기피 음식
            </h3>
            <div v-if="authStore.user?.allergies?.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in authStore.user.allergies"
                :key="tag"
                class="text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl font-bold border border-rose-100 flex items-center gap-1"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 pl-1">등록된 정보가 없습니다.</p>
          </div>

          <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
              <Stethoscope :size="18" class="text-blue-500" /> 건강 고민 / 질병
            </h3>
            <div v-if="authStore.user?.diseases?.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in authStore.user.diseases"
                :key="tag"
                class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-bold border border-blue-100 flex items-center gap-1"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 pl-1">등록된 정보가 없습니다.</p>
          </div>
        </div>
      </main>

      <BottomNav />

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
