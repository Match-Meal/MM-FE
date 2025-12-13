<script lang="ts" setup>
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { PostListItem } from '@/services/communityService'

defineProps<{
  isOpen: boolean
  title: string
  postList: PostListItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()

// 배경 클릭 시 닫기
const close = () => {
  emit('close')
}

const goToPost = (postId: number) => {
    router.push(`/community/${postId}`)
    // 모달 닫기
    close()
}
</script>

<template>
  <!-- 게시글 리스트 모달 (바텀 시트) -->
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
        <span class="text-sm text-gray-500 font-medium">{{ postList.length }}개</span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-gray-50/50">
        <!-- 빈 목록 -->
        <div
          v-if="postList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-gray-400"
        >
          <span class="text-4xl mb-2">✍️</span>
          <p class="text-sm">작성한 게시글이 없습니다.</p>
        </div>

        <!-- 게시글 리스트 -->
        <div
          v-for="post in postList"
          :key="post.postId"
          @click="goToPost(post.postId)"
          class="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition"
        >
          <div class="flex-1 min-w-0 pr-2">
             <div class="flex items-center gap-2 mb-1">
                 <span v-if="post.category === 'NOTICE'" class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">공지</span>
                 <span v-else class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{{ post.category }}</span>
                 <span class="text-xs text-gray-400">{{ dayjs(post.createdAt).format('YYYY.MM.DD') }}</span>
             </div>
             <p class="text-sm font-bold text-gray-800 truncate mb-1">{{ post.title }}</p>
             <div class="flex items-center gap-3 text-[10px] text-gray-400">
                 <span>조회 {{ post.viewCount }}</span>
                 <span>좋아요 {{ post.likeCount }}</span>
                 <span>댓글 {{ post.commentCount }}</span>
             </div>
          </div>
          <span class="text-gray-300 text-lg">›</span>
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
