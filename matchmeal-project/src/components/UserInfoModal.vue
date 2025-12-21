<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import type { PostUser } from '@/services/communityService'
import type { FollowUser } from '@/components/FollowListModal.vue'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  isOpen: boolean
  user: PostUser
  showChallengeLog?: boolean // [Added] 챌린지 기록 보기 버튼 활성화 여부
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'view-challenge-log'): void // [Added] 챌린지 기록 보기 이벤트
}>()

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const isLoading = ref(false)
const isFollowing = ref(false)
const isChecking = ref(true)

// 프로필 페이지 이동 함수
const goToProfile = () => {
  // 1. 모달 닫기
  emit('close')

  // 2. 내 프로필인 경우
  if (authStore.user?.id === props.user.userId) {
    router.push('/profile')
  } else {
    // 3. 타인 프로필인 경우 (/user/:id)
    router.push(`/user/${props.user.userId}`)
  }
}

const checkFollowStatus = async () => {
  isChecking.value = true
  try {
    if (!authStore.user) return

    // 내 팔로잉 목록을 가져와서 확인 (기존 ProfileView 로직 활용)
    // [Modified] axios -> apiClient 변경 (인증 헤더 자동 포함)
    const response = await apiClient.get(`/user/${authStore.user.id}/followings`)
    const followingList = response.data.data
    const found = followingList.find((u: FollowUser) => u.userId === props.user.userId)
    isFollowing.value = !!found
  } catch (e) {
    console.error('Follow status check failed', e)
  } finally {
    isChecking.value = false
  }
}

// 모달이 열릴 때마다 팔로우 상태 확인
watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal && props.user) {
      if (props.user.userId === authStore.user?.id) {
        // 나 자신이면 확인 불필요
        isChecking.value = false
        return
      }
      await checkFollowStatus()
    }
  },
  { immediate: true },
)

const toggleFollow = async () => {
  if (!authStore.user) {
    toastStore.show('로그인이 필요합니다.')
    return
  }

  isLoading.value = true
  try {
    // [Modified] axios -> apiClient
    const response = await apiClient.post(`/user/${props.user.userId}/follow`)
    const result = response.data.data // CommonResponse의 data

    // 응답으로 상태 업데이트
    if (result && result.isFollowing !== undefined) {
      isFollowing.value = result.isFollowing
    } else {
      // fallback
      isFollowing.value = !isFollowing.value
    }

    // 내 팔로잉 수 업데이트 (AuthStore)
    if (result && result.myFollowingCount !== undefined && authStore.user) {
      authStore.user.followingCount = result.myFollowingCount
    }

    toastStore.show(isFollowing.value ? '팔로우했습니다.' : '팔로우를 취소했습니다.')
  } catch (e) {
    console.error(e)
    toastStore.show('요청 처리에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const close = () => emit('close')
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 transition-opacity" @click="close"></div>

    <!-- Modal Card -->
    <div
      class="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center animate-pop-in z-10"
    >
      <!-- Close Button -->
      <button @click="close" class="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
        ✕
      </button>

      <!-- Profile Image -->
      <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 mb-4 shadow-sm">
        <img
          v-if="user.profileImage"
          :src="user.profileImage"
          alt="Profile"
          class="w-full h-full object-cover"
        />
        <span v-else class="w-full h-full flex items-center justify-center bg-gray-100 text-4xl"
          >😎</span
        >
      </div>

      <!-- Name -->
      <h3 class="text-xl font-bold text-gray-800 mb-1">{{ user.userName }}</h3>

      <!-- Status / Action -->
      <div class="mt-6 w-full">
        <!-- 나 자신일 경우 팔로우 버튼 숨김, 나머지 버튼은 노출 -->

        <div
          v-if="isChecking && user.userId !== authStore.user?.id"
          class="flex justify-center py-6"
        >
          <div
            class="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"
          ></div>
        </div>

        <!-- [Modified] 로딩 중에는 버튼 숨김 -->
        <div v-else class="w-full space-y-2">
          <!-- 팔로우 버튼 (타인일 때만) -->
          <button
            v-if="user.userId !== authStore.user?.id"
            @click="toggleFollow"
            :disabled="isLoading"
            class="w-full py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2"
            :class="
              isFollowing
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            <span
              v-if="isLoading"
              class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            ></span>
            <span>{{ isFollowing ? '언팔로우' : '팔로우' }}</span>
          </button>

          <!-- 챌린지 기록 보기 버튼 -->
          <button
            v-if="showChallengeLog"
            @click="emit('view-challenge-log')"
            class="w-full py-3 rounded-xl font-bold text-sm bg-orange-500 text-white shadow-md hover:bg-orange-600 transition active:scale-95"
          >
            🔥 챌린지 기록 보기
          </button>

          <button
            @click="goToProfile"
            class="w-full py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            프로필 상세
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-pop-in {
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
