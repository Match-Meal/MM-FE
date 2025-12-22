<script lang="ts" setup>
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { PostListItem } from '@/services/communityService'
import {
  PenLine,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Megaphone,
  FileText
} from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  title: string
  postList: PostListItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()

const close = () => {
  emit('close')
}

const goToPost = (postId: number) => {
    router.push(`/community/${postId}`)
    close()
}
</script>

<template>
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
        <span class="text-sm text-slate-500 font-medium">{{ postList.length }}개</span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-50/50">
        <!-- 빈 목록 -->
        <div
          v-if="postList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-slate-400 gap-3"
        >
          <PenLine :size="40" stroke-width="1.5" />
          <p class="text-sm">작성한 게시글이 없습니다.</p>
        </div>

        <!-- 게시글 리스트 -->
        <div
          v-for="post in postList"
          :key="post.postId"
          @click="goToPost(post.postId)"
          class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition hover:shadow-md hover:border-slate-200"
        >
          <div class="flex-1 min-w-0 pr-4">
             <div class="flex items-center gap-2 mb-1.5">
                 <span v-if="post.category === 'NOTICE'" class="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Megaphone :size="10" /> 공지
                 </span>
                 <span v-else class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <FileText :size="10" /> {{ post.category }}
                 </span>
                 <span class="text-xs text-slate-400 font-medium">{{ dayjs(post.createdAt).format('YYYY.MM.DD') }}</span>
             </div>
             <p class="text-sm font-bold text-slate-800 truncate mb-2 leading-tight">{{ post.title }}</p>
             <div class="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                 <span class="flex items-center gap-0.5"><Eye :size="12" /> {{ post.viewCount }}</span>
                 <span class="flex items-center gap-0.5"><Heart :size="12" /> {{ post.likeCount }}</span>
                 <span class="flex items-center gap-0.5"><MessageCircle :size="12" /> {{ post.commentCount }}</span>
             </div>
          </div>
          <ChevronRight :size="20" class="text-slate-300" />
        </div>
      </div>
    </div>
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
