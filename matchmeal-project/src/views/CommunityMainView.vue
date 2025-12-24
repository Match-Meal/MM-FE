<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import {
  getPosts,
  CommunityCategory,
  type PostDetail,
  type PageInfo,
} from '@/services/communityService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import BottomNav from '@/components/common/BottomNav.vue'
import { 
  ArrowLeft, 
  Search, 
  PenSquare, 
  UserCircle2, 
  Heart, 
  MessageSquare, 
  Eye,
  Filter,
  X
} from 'lucide-vue-next'

defineOptions({
  name: 'CommunityMainView',
})

dayjs.extend(relativeTime)
dayjs.locale('ko')

const router = useRouter()

// --- State ---
const posts = ref<PostDetail[]>([])
const pageInfo = ref<PageInfo<PostDetail>['pageInfo'] | null>(null)
const currentPage = ref(1)
const isLoading = ref(false)

const error = ref<string | null>(null)

// Filters
const selectedCategory = ref<string>('') // '' means ALL
const keyword = ref('')
const searchType = ref<'TITLE' | 'CONTENT' | 'TITLE_CONTENT' | 'WRITER'>('TITLE_CONTENT')
const sortType = ref<'LATEST' | 'OLDEST' | 'VIEWS' | 'LIKES'>('LATEST')
const startDate = ref('')
const endDate = ref('')

const isSearchOpen = ref(false)

const categories = [
  { label: '전체', value: '' },
  { label: '공지', value: CommunityCategory.NOTICE },
  { label: '식단', value: CommunityCategory.DIET },
  { label: '정보', value: CommunityCategory.INFO },
  { label: '질문', value: CommunityCategory.QNA },
  { label: '자유', value: CommunityCategory.FREE },
]

// --- Methods ---
const fetchPostList = async (page: number = 1) => {
  try {
    isLoading.value = true
    error.value = null

    const params = {
      page: page - 1,
      size: 20,
      category: selectedCategory.value || undefined,
      keyword: keyword.value || undefined,
      searchType: keyword.value ? searchType.value : undefined, // Only send searchType if keyword exists
      sortType: sortType.value,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
    }

    const response = await getPosts(params)
    posts.value = response.content
    pageInfo.value = response.pageInfo
    currentPage.value = response.pageInfo.pageNo
  } catch (err) {
    console.error('Failed to fetch posts:', err)
    error.value = '게시글을 불러오는데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

const goDetail = (postId: number) => {
  router.push(`/community/${postId}`)
}

const goWrite = () => {
  router.push('/community/write')
}

const goBack = () => {
  router.push('/home')
}

const handleSearch = () => {
  fetchPostList(1)
}

const selectCategory = (catValue: string) => {
  selectedCategory.value = catValue
  fetchPostList(1)
}

const changePage = (page: number) => {
  if (pageInfo.value && page >= 1 && page <= pageInfo.value.totalPage) {
    fetchPostList(page)
    // Scroll to top
    const container = document.querySelector('main')
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const formatTime = (dateStr: string) => {
  return dayjs(dateStr).fromNow()
}

const getCategoryLabel = (catValue: string) => {
  const match = categories.find((c) => c.value === catValue)
  return match ? match.label : catValue
}

// --- Lifecycle ---
onMounted(() => {
  fetchPostList()
})

import { onBeforeRouteLeave } from 'vue-router'

// ... (existing imports)

onActivated(() => {
  fetchPostList(currentPage.value)
})

// Reset filters when leaving Community section (e.g. going to Home/Diet)
// But keep them when going to Detail/Write
onBeforeRouteLeave((to, from, next) => {
  if (to.name && !String(to.name).startsWith('community-')) {
    selectedCategory.value = ''
    keyword.value = ''
    searchType.value = 'TITLE_CONTENT'
    sortType.value = 'LATEST'
    startDate.value = ''
    endDate.value = ''
    isSearchOpen.value = false
    // Also reset list? Maybe not strictly necessary if fetchPostList runs on mount/activeted,
    // but cleaning up is good.
    // fetchPostList(1); // No, let it refetch next time.
  }
  next()
})
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      id="mobile-frame"
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- Header -->
      <header class="relative bg-white border-b border-slate-100 h-14 flex items-center px-4 sticky top-0 z-20 shrink-0 justify-between">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600 z-10 relative">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-lg text-slate-800">
          커뮤니티
        </h1>
        <div class="flex justify-end z-10 relative">
          <button 
            @click="isSearchOpen = !isSearchOpen" 
            class="p-2 -mr-2 rounded-full hover:bg-slate-50 transition"
            :class="isSearchOpen ? 'text-primary-600 bg-primary-50' : 'text-slate-600'"
          >
            <Search v-if="!isSearchOpen" :size="24" />
            <X v-else :size="24" />
          </button>
        </div>
      </header>

      <!-- Search Bar -->
      <transition name="slide">
        <div v-if="isSearchOpen" class="px-6 py-4 bg-white border-b border-gray-100 z-10 space-y-4 shadow-sm">
          <!-- Search Type & Date Range -->
          <div class="flex flex-col gap-3">
            <!-- Search Type -->
            <div class="relative">
                <select
                v-model="searchType"
                class="bg-gray-50 text-xs font-medium rounded-xl px-4 h-10 w-full appearance-none border border-gray-100 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition"
                >
                <option value="TITLE_CONTENT">제목+내용</option>
                <option value="TITLE">제목</option>
                <option value="CONTENT">내용</option>
                <option value="WRITER">작성자</option>
                </select>
                <Filter :size="14" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <!-- Date Range -->
            <div class="flex items-center gap-2">
              <input
                type="date"
                v-model="startDate"
                class="bg-gray-50 text-xs font-medium rounded-xl px-3 h-10 flex-1 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 border border-gray-100 transition min-w-0"
                placeholder="시작일"
              />
              <span class="text-gray-400">-</span>
              <input
                type="date"
                v-model="endDate"
                class="bg-gray-50 text-xs font-medium rounded-xl px-3 h-10 flex-1 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 border border-gray-100 transition min-w-0"
                placeholder="종료일"
              />
            </div>
          </div>

          <!-- Keyword Input -->
          <form @submit.prevent="handleSearch" class="relative">
            <input
              v-model="keyword"
              type="text"
              placeholder="검색어를 입력하세요"
              class="w-full h-12 bg-gray-50 rounded-xl pl-4 pr-12 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 border border-gray-100 transition"
            />
            <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 rounded-lg text-white shadow-md shadow-primary-200 hover:bg-primary-700 transition">
                <Search :size="16" />
            </button>
          </form>
        </div>
      </transition>

      <!-- Category Filter & Sort -->
      <div class="bg-white border-b border-gray-50 z-10 shadow-sm">
        <div class="px-6 py-4 flex flex-col gap-4">
          <!-- Categories -->
          <div class="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-2 w-full pb-1">
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="selectCategory(cat.value)"
              class="px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0"
              :class="
                selectedCategory === cat.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              "
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Sort Type (Right aligned) -->
          <div class="flex justify-end border-t border-gray-100 pt-3">
            <select
              v-model="sortType"
              @change="fetchPostList(1)"
              class="text-xs focus:outline-none bg-transparent font-bold text-gray-500 py-1 pr-1 cursor-pointer hover:text-gray-800 transition"
            >
              <option value="LATEST">최신순</option>
              <option value="OLDEST">오래된 순</option>
              <option value="VIEWS">조회순</option>
              <option value="LIKES">좋아요순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto bg-slate-50 p-6 pb-24 no-scrollbar">
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>

        <div
          v-else-if="posts.length === 0"
          class="flex flex-col items-center justify-center py-20 text-gray-400 gap-4"
        >
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
            <Search :size="32" />
          </div>
          <p class="text-sm font-medium">게시글이 없습니다.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="post in posts"
            :key="post.postId"
            @click="goDetail(post.postId)"
            class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-smooth hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <!-- User Info -->
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-10 h-10 bg-gray-50 rounded-full overflow-hidden flex items-center justify-center border border-gray-100 text-gray-300"
              >
                <img
                  v-if="post.user?.profileImage"
                  :src="post.user.profileImage"
                  class="w-full h-full object-cover"
                />
                <UserCircle2 v-else :size="24" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <p
                    :class="[
                      'text-sm font-bold truncate',
                      !post.user?.userName ? 'text-gray-400' : 'text-slate-800',
                    ]"
                  >
                    {{ post.user?.userName || '탈퇴한 사용자' }}
                  </p>
                  <span class="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-bold border border-primary-100">{{
                    getCategoryLabel(post.category)
                  }}</span>
                </div>
                <div class="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                  <span>{{ formatTime(post.createdAt) }}</span>
                  <span class="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                  <span class="flex items-center gap-0.5">
                    <Eye :size="10" /> {{ post.viewCount }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Title & Content Preview -->
            <h3 class="font-bold text-base mb-2 truncate text-slate-900 group-hover:text-primary-700 transition-colors">{{ post.title }}</h3>
            <p class="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed font-medium">
              {{ post.content }}
            </p>

            <!-- Files / Thumbnail -->
            <div
              v-if="post.images && post.images.length > 0"
              class="h-44 bg-gray-100 rounded-2xl mb-4 overflow-hidden relative border border-gray-100"
            >
              <img
                v-if="post.images[0]"
                :src="post.images[0].fileUrl"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div
                v-if="post.images.length > 1"
                class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold"
              >
                +{{ post.images.length - 1 }}
              </div>
            </div>

            <!-- Footer (Like / Comment) -->
            <div class="flex items-center gap-4 text-gray-400 text-xs font-medium border-t border-gray-50 pt-3">
              <div class="flex items-center gap-1.5" :class="post.isLiked ? 'text-rose-500' : ''">
                <Heart :size="14" :fill="post.isLiked ? 'currentColor' : 'none'" /> {{ post.likeCount }}
              </div>
              <div class="flex items-center gap-1.5">
                <MessageSquare :size="14" /> {{ post.commentCount }}
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pageInfo && pageInfo.totalPage > 1" class="py-8 flex justify-center gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            이전
          </button>
          <span class="text-xs font-bold text-slate-800 flex items-center px-4 bg-white rounded-xl border border-gray-200"
            >{{ currentPage }} / {{ pageInfo.totalPage }}</span
          >
          <button
            @click="changePage(currentPage + 1)"
            :disabled="!pageInfo.hasNext"
            class="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            다음
          </button>
        </div>
      </main>

      <!-- FAB (Write Button) -->
      <button
        @click="goWrite"
        class="absolute bottom-24 right-6 w-14 h-14 bg-accent text-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center z-30 hover:brightness-105 hover:scale-105 transition-all duration-300 active:scale-95 group"
      >
        <PenSquare :size="24" class="group-hover:-rotate-12 transition-transform duration-300" />
      </button>

      <!-- Bottom Nav -->
      <BottomNav />
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 200px;
  opacity: 1;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
