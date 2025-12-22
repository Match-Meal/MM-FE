<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import type { PostUser } from '@/services/communityService'
import type { FollowUser } from '@/components/FollowListModal.vue'
import { useToastStore } from '@/stores/toast'
import {
  X,
  User,
  MinusCircle,
  PlusCircle,
  Flame,
  ArrowRight,
  Loader2
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  user: PostUser
  showChallengeLog?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'view-challenge-log'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const isLoading = ref(false)
const isFollowing = ref(false)
const isChecking = ref(true)

const goToProfile = () => {
  emit('close')
  if (authStore.user?.id === props.user.userId) {
    router.push('/profile')
  } else {
    router.push(`/user/${props.user.userId}`)
  }
}

const checkFollowStatus = async () => {
  isChecking.value = true
  try {
    if (!authStore.user) return

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

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal && props.user) {
      if (props.user.userId === authStore.user?.id) {
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
    const response = await apiClient.post(`/user/${props.user.userId}/follow`)
    const result = response.data.data

    if (result && result.isFollowing !== undefined) {
      isFollowing.value = result.isFollowing
    } else {
      isFollowing.value = !isFollowing.value
    }

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
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="close"></div>

    <!-- Modal Card -->
    <div
      class="relative bg-white rounded-[32px] shadow-float w-full max-w-[320px] p-6 flex flex-col items-center animate-pop-in z-10 border border-slate-100"
    >
      <!-- Close Button -->
      <button @click="close" class="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-1 rounded-full hover:bg-slate-50 transition">
        <X :size="20" />
      </button>

      <!-- Profile Image -->
      <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 mb-4 shadow-sm relative group">
        <img
          v-if="user.profileImage"
          :src="user.profileImage"
          alt="Profile"
          class="w-full h-full object-cover transition duration-300 group-hover:scale-110"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
            <User :size="40" />
        </div>
      </div>

      <!-- Name -->
      <h3 class="text-xl font-bold text-slate-800 mb-1">{{ user.userName }}</h3>
      <p class="text-xs text-slate-400 font-medium mb-6">MatchMeal User</p>

      <!-- Status / Action -->
      <div class="w-full space-y-2.5">
        <div
          v-if="isChecking && user.userId !== authStore.user?.id"
          class="flex justify-center py-4"
        >
          <Loader2 :size="24" class="text-primary-500 animate-spin" />
        </div>

        <div v-else class="w-full space-y-2.5">
          <!-- 팔로우 버튼 (타인일 때만) -->
          <button
            v-if="user.userId !== authStore.user?.id"
            @click="toggleFollow"
            :disabled="isLoading"
            class="w-full h-12 rounded-2xl font-bold transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-sm"
            :class="
              isFollowing
                ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 shadow-none'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
            "
          >
            <Loader2 v-if="isLoading" :size="16" class="animate-spin" />
            <div v-else class="flex items-center gap-1.5">
                <component :is="isFollowing ? MinusCircle : PlusCircle" :size="16" />
                <span>{{ isFollowing ? '언팔로우' : '팔로우' }}</span>
            </div>
          </button>

          <!-- 챌린지 기록 보기 버튼 -->
          <button
            v-if="showChallengeLog"
            @click="emit('view-challenge-log')"
            class="w-full h-12 rounded-2xl font-bold text-sm bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Flame :size="16" fill="currentColor" />
            챌린지 기록 보기
          </button>

          <button
            @click="goToProfile"
            class="w-full h-12 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            프로필 상세
            <ArrowRight :size="16" />
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
