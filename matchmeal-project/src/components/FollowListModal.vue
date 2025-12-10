<script lang="ts" setup>
import { ref } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

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
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle', user: FollowUser): void
}>()

// 언팔 확인 모달 상태
const isConfirmOpen = ref(false)
const targetUser = ref<FollowUser | null>(null)

// 배경 클릭 시 닫기
const close = () => {
  emit('close')
}

// [핵심 로직] 버튼 클릭 핸들러
const handleToggleClick = (user: FollowUser) => {
  if (user.isFollowing) {
    // Case 1: 이미 팔로우 중 -> 언팔로우 시도 -> 경고 모달 띄우기
    targetUser.value = user
    isConfirmOpen.value = true
  } else {
    // Case 2: 팔로우 안 함 -> 팔로우 시도 -> 즉시 실행
    emit('toggle', user)
  }
}

// 경고 모달에서 '확인'을 눌렀을 때 실행
const confirmUnfollow = () => {
  if (targetUser.value) {
    emit('toggle', targetUser.value) // 부모에게 이벤트 전달
    isConfirmOpen.value = false // 모달 닫기
    targetUser.value = null // 대상 초기화
  }
}
</script>

<template>
  <!-- 팔로우 리스트 모달 (바텀 시트) -->
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- 어두운 배경 -->
    <div
      class="absolute inset-0 bg-black/60 transition-opacity animate-fade-in"
      @click="close"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div
      class="relative w-full bg-white rounded-t-3xl shadow-2xl h-[70%] flex flex-col animate-slide-up overflow-hidden z-10"
    >
      <!-- 핸들바 -->
      <div class="w-full flex justify-center pt-3 pb-2" @click="close">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
      </div>

      <!-- 헤더 -->
      <div class="px-6 pb-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-gray-800">{{ title }}</h3>
        <span class="text-sm text-gray-500 font-medium">{{ userList.length }}명</span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50/50">
        <!-- 빈 목록 -->
        <div
          v-if="userList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-gray-400"
        >
          <span class="text-4xl mb-2">🍃</span>
          <p class="text-sm">목록이 비어있습니다.</p>
        </div>

        <!-- 유저 리스트 -->
        <div
          v-for="user in userList"
          :key="user.userId"
          class="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100"
        >
          <div class="flex items-center gap-3">
            <!-- 프로필 이미지 -->
            <div class="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <img
                v-if="user.profileImage"
                :src="user.profileImage"
                class="w-full h-full object-cover"
                alt="프사"
              />
              <span v-else class="w-full h-full flex items-center justify-center text-lg">😎</span>
            </div>
            <!-- 닉네임 -->
            <span class="font-bold text-sm text-gray-800">{{ user.userName }}</span>
          </div>

          <!-- [버튼] 상태에 따라 스타일과 텍스트 변경 -->
          <button
            @click.stop="handleToggleClick(user)"
            class="px-3 py-1.5 rounded-full text-xs font-bold transition border"
            :class="
              user.isFollowing
                ? 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
            "
          >
            <!-- isFollowing이 true면 '언팔로우'(또는 팔로잉), false면 '팔로우' -->
            {{ user.isFollowing ? '언팔로우' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>

    <!-- [추가] 언팔로우 확인용 커스텀 모달 (z-index가 더 높아야 함) -->
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
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
