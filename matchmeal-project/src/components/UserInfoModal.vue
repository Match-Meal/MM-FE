<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import type { PostUser } from '@/services/communityService'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  isOpen: boolean
  user: PostUser
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const toastStore = useToastStore()

const isLoading = ref(false)
const isFollowing = ref(false)
const isChecking = ref(true)

// 모달이 열릴 때마다 팔로우 상태 확인
watch(() => props.isOpen, async (newVal) => {
    if (newVal && props.user) {
        if (props.user.userId === authStore.user?.id) {
            // 나 자신이면 확인 불필요
            isChecking.value = false
            return
        }
        await checkFollowStatus()
    }
})

const checkFollowStatus = async () => {
    isChecking.value = true
    try {
        if (!authStore.user) return

        // 내 팔로잉 목록을 가져와서 확인 (기존 ProfileView 로직 활용)
        const response = await axios.get<any[]>(
            `http://localhost:8080/user/${authStore.user.id}/followings`
        )
        const followingList = response.data
        const found = followingList.find((u: any) => u.userId === props.user.userId)
        isFollowing.value = !!found
    } catch (e) {
        console.error('Follow status check failed', e)
    } finally {
        isChecking.value = false
    }
}

const toggleFollow = async () => {
    if (!authStore.user) {
        toastStore.show('로그인이 필요합니다.')
        return
    }
    
    isLoading.value = true
    try {
        const response = await axios.post(`http://localhost:8080/user/${props.user.userId}/follow`)
        
        // 응답으로 상태 업데이트
        if (response.data.isFollowing !== undefined) {
            isFollowing.value = response.data.isFollowing
        } else {
            // fallback if response doesn't have isFollowing
             isFollowing.value = !isFollowing.value
        }
        
        // 내 팔로잉 수 업데이트 (AuthStore)
         if (response.data.myFollowingCount !== undefined && authStore.user) {
            authStore.user.followingCount = response.data.myFollowingCount
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
    <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center animate-pop-in z-10">
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
             <span v-else class="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">😎</span>
        </div>

        <!-- Name -->
        <h3 class="text-xl font-bold text-gray-800 mb-1">{{ user.userName }}</h3>
        
        <!-- Status / Action -->
        <div class="mt-6 w-full">
            <div v-if="user.userId === authStore.user?.id" class="text-center text-gray-400 text-sm">
                나 자신입니다.
            </div>
            <div v-else-if="isChecking" class="flex justify-center py-2">
                 <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <button
                v-else
                @click="toggleFollow"
                :disabled="isLoading"
                class="w-full py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                :class="isFollowing 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'"
            >
                <span v-if="isLoading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isFollowing ? '언팔로우' : '팔로우' }}</span>
            </button>
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
