<script lang="ts" setup>
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

// 배경 클릭 시 닫기
const close = () => {
  emit('close')
}

// 팔로우/언팔로우 버튼 클릭 핸들러
const handleToggle = (user: FollowUser) => {
  emit('toggle', user)
}
</script>

<template>
  <!-- 모달 오버레이 (배경) -->
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- 어두운 배경 (클릭 시 닫힘) -->
    <div
      class="absolute inset-0 bg-black/60 transition-opacity animate-fade-in"
      @click="close"
    ></div>

    <!-- 모달 컨텐츠 (바텀 시트) -->
    <div
      class="relative w-full bg-white rounded-t-3xl shadow-2xl h-[70%] flex flex-col animate-slide-up overflow-hidden"
    >
      <!-- 상단 핸들바 -->
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
        <!-- 목록이 비었을 때 -->
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

          <!-- 팔로우 토글 버튼 -->
          <button
            @click.stop="handleToggle(user)"
            class="px-3 py-1.5 rounded-full text-xs font-bold transition border"
            :class="
              user.isFollowing
                ? 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
            "
          >
            {{ user.isFollowing ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>
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
