<script lang="ts" setup>
import { ref } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  User,
  Users,
  Leaf,
  MinusCircle,
  PlusCircle
} from 'lucide-vue-next'

export interface FollowUser {
  userId: number
  userName: string
  profileImage: string | null
  isFollowing: boolean
}

defineProps<{
  isOpen: boolean
  title: string
  userList: FollowUser[]
  currentUserId?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle', user: FollowUser): void
  (e: 'click-user', user: FollowUser): void
}>()

const isConfirmOpen = ref(false)
const targetUser = ref<FollowUser | null>(null)

const close = () => {
  emit('close')
}

const handleToggleClick = (user: FollowUser) => {
  if (user.isFollowing) {
    targetUser.value = user
    isConfirmOpen.value = true
  } else {
    emit('toggle', user)
  }
}

const handleRowClick = (user: FollowUser) => {
  emit('click-user', user)
}

const confirmUnfollow = () => {
  if (targetUser.value) {
    emit('toggle', targetUser.value)
    isConfirmOpen.value = false
    targetUser.value = null
  }
}
</script>

<template>
  <!-- 팔로우 리스트 모달 (바텀 시트) -->
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- 어두운 배경 -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
      @click="close"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div
      class="relative w-full max-w-md bg-white rounded-t-[35px] shadow-2xl h-[70%] flex flex-col animate-slide-up overflow-hidden z-10"
    >
      <!-- 핸들바 -->
      <div class="w-full flex justify-center pt-3 pb-2 cursor-pointer" @click="close">
        <div class="w-12 h-1.5 bg-slate-300 rounded-full"></div>
      </div>

      <!-- 헤더 -->
      <div class="px-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-slate-800">{{ title }}</h3>
        <span class="text-sm text-slate-500 font-medium flex items-center gap-1">
            <Users :size="16" />
            {{ userList.length }}명
        </span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-50/50">
        <!-- 빈 목록 -->
        <div
          v-if="userList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-slate-400 gap-2"
        >
          <Leaf :size="40" stroke-width="1.5" />
          <p class="text-sm">목록이 비어있습니다.</p>
        </div>

        <!-- 유저 리스트 -->
        <div
          v-for="user in userList"
          :key="user.userId"
          class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50/50"
          @click="handleRowClick(user)"
        >
          <div class="flex items-center gap-3">
            <!-- 프로필 이미지 -->
            <div class="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <img
                v-if="user.profileImage"
                :src="user.profileImage"
                class="w-full h-full object-cover"
                alt="프사"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                  <User :size="20" />
              </div>
            </div>
            <!-- 닉네임 -->
            <div class="flex flex-col">
              <span class="font-bold text-sm text-slate-800 flex items-center gap-1">
                <span :class="{ 'text-slate-400': !user.userName }">{{
                  user.userName || '탈퇴한 사용자'
                }}</span>
                <span
                  v-if="currentUserId && user.userId === currentUserId"
                  class="text-[10px] bg-primary-100 text-primary-600 px-1.5 rounded-md font-bold"
                  >ME</span
                >
              </span>
            </div>
          </div>

          <!-- [버튼] 나 자신이 아닐 때만 노출 -->
          <button
            v-if="!currentUserId || user.userId !== currentUserId"
            @click.stop="handleToggleClick(user)"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="
              user.isFollowing
                ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
                : 'bg-primary-600 text-white shadow-md shadow-primary-200 hover:bg-primary-700'
            "
          >
            <component :is="user.isFollowing ? MinusCircle : PlusCircle" :size="14" />
            {{ user.isFollowing ? '언팔로우' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :is-open="isConfirmOpen"
      title="팔로우 취소"
      :message="`${targetUser?.userName}님을 팔로우 취소하시겠습니까?`"
      confirm-text="언팔로우"
      cancel-text="취소"
      @close="isConfirmOpen = false"
      @confirm="confirmUnfollow"
    />
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
