<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { 
  getPosts, 
  CommunityCategory, 
  type PostDetail, 
  type PageInfo 
} from '@/services/communityService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

defineOptions({
  name: 'CommunityMainView'
});

dayjs.extend(relativeTime);
dayjs.locale('ko');

const router = useRouter();

// --- State ---
const posts = ref<PostDetail[]>([]);
const pageInfo = ref<PageInfo<PostDetail>['pageInfo'] | null>(null);
const currentPage = ref(1);
const isLoading = ref(false);

const error = ref<string | null>(null);

// Filters
const selectedCategory = ref<string>(''); // '' means ALL
const keyword = ref('');
const searchType = ref<'TITLE' | 'CONTENT' | 'TITLE_CONTENT' | 'WRITER'>('TITLE_CONTENT');
const sortType = ref<'LATEST' | 'OLDEST' | 'VIEWS' | 'LIKES'>('LATEST');
const startDate = ref('');
const endDate = ref('');

const isSearchOpen = ref(false);

const categories = [
  { label: '전체', value: '' },
  { label: '공지', value: CommunityCategory.NOTICE },
  { label: '식단', value: CommunityCategory.DIET },
  { label: '정보', value: CommunityCategory.INFO },
  { label: '질문', value: CommunityCategory.QNA },
  { label: '자유', value: CommunityCategory.FREE },
];

// --- Methods ---
const fetchPostList = async (page: number = 1) => {
  try {
    isLoading.value = true;
    error.value = null;

    const params = {
          page: page - 1,
          size: 20,
          category: selectedCategory.value || undefined,
          keyword: keyword.value || undefined,
          searchType: keyword.value ? searchType.value : undefined, // Only send searchType if keyword exists
          sortType: sortType.value,
          startDate: startDate.value || undefined,
          endDate: endDate.value || undefined
        };

    const response = await getPosts(params);
    posts.value = response.content;
    pageInfo.value = response.pageInfo;
    currentPage.value = response.pageInfo.pageNo;
  } catch (err) {
    console.error('Failed to fetch posts:', err);
    error.value = '게시글을 불러오는데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goDetail = (postId: number) => {
  router.push(`/community/${postId}`);
};

const goWrite = () => {
  router.push('/community/write');
};

const goBack = () => {
  router.push('/home');
};

const handleSearch = () => {
  fetchPostList(1);
};

const selectCategory = (catValue: string) => {
  selectedCategory.value = catValue;
  fetchPostList(1);
};

const changePage = (page: number) => {
  if (pageInfo.value && page >= 1 && page <= pageInfo.value.totalPage) {
    fetchPostList(page);
    // Scroll to top
    const container = document.querySelector('main');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const formatTime = (dateStr: string) => {
  return dayjs(dateStr).fromNow();
};

const getCategoryLabel = (catValue: string) => {
  const match = categories.find(c => c.value === catValue);
  return match ? match.label : catValue;
};

// --- Lifecycle ---
onMounted(() => {
  fetchPostList();
});

import { onBeforeRouteLeave } from 'vue-router';

// ... (existing imports)

onActivated(() => {
  fetchPostList(currentPage.value);
});

// Reset filters when leaving Community section (e.g. going to Home/Diet)
// But keep them when going to Detail/Write
onBeforeRouteLeave((to, from, next) => {
  if (to.name && !String(to.name).startsWith('community-')) {
      selectedCategory.value = '';
      keyword.value = '';
      searchType.value = 'TITLE_CONTENT';
      sortType.value = 'LATEST';
      startDate.value = '';
      endDate.value = '';
      isSearchOpen.value = false;
      // Also reset list? Maybe not strictly necessary if fetchPostList runs on mount/activeted,
      // but cleaning up is good.
      // fetchPostList(1); // No, let it refetch next time.
  }
  next();
});
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">커뮤니티</h1>
        <div class="w-8 flex justify-end">
             <button @click="isSearchOpen = !isSearchOpen" class="text-xl">🔍</button>
        </div>
      </header>

      <!-- Search Bar -->
      <transition name="slide">
        <div v-if="isSearchOpen" class="px-4 py-3 bg-white border-b z-10 space-y-3">
            <!-- Search Type & Date Range -->
            <div class="flex flex-col gap-2">
                <!-- Search Type -->
                 <select v-model="searchType" class="bg-gray-100 text-xs rounded-lg px-2 h-9 focus:outline-none w-full appearance-none">
                    <option value="TITLE_CONTENT">제목+내용</option>
                    <option value="TITLE">제목</option>
                    <option value="CONTENT">내용</option>
                    <option value="WRITER">작성자</option>
                </select>

                <!-- Date Range -->
                <div class="flex items-center gap-2">
                    <input type="date" v-model="startDate" class="bg-gray-100 text-xs rounded-lg px-2 h-9 flex-1 focus:outline-none min-w-0" placeholder="시작일">
                    <span class="text-gray-400">~</span>
                    <input type="date" v-model="endDate" class="bg-gray-100 text-xs rounded-lg px-2 h-9 flex-1 focus:outline-none min-w-0" placeholder="종료일">
                </div>
            </div>

            <!-- Keyword Input -->
            <form @submit.prevent="handleSearch" class="relative">
                <input 
                v-model="keyword" 
                type="text" 
                placeholder="검색어를 입력하세요" 
                class="w-full h-10 bg-gray-100 rounded-lg pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                <button type="submit" class="absolute right-2 top-0 h-full text-gray-400">🔍</button>
            </form>
        </div>
      </transition>

      <!-- Category Filter & Sort -->
      <div class="bg-white border-b z-10">
          <div class="px-4 py-3 flex flex-col gap-3">
              <!-- Categories -->
              <div class="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-2 w-full">
                  <button 
                  v-for="cat in categories" 
                  :key="cat.value"
                  @click="selectCategory(cat.value)"
                  class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors border shrink-0"
                  :class="selectedCategory === cat.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'"
                  >
                  {{ cat.label }}
                  </button>
              </div>

              <!-- Sort Type (Right aligned) -->
              <div class="flex justify-end border-t pt-2 border-gray-100">
                  <select v-model="sortType" @change="fetchPostList(1)" class="text-xs focus:outline-none bg-white font-bold text-gray-500 py-1">
                    <option value="LATEST">최신순</option>
                    <option value="OLDEST">오래된 순</option>
                    <option value="VIEWS">조회순</option>
                    <option value="LIKES">좋아요순</option>
                </select>
              </div>
          </div>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto bg-gray-100 p-4 pb-20 no-scrollbar">
        
        <div v-if="isLoading" class="flex items-center justify-center py-10">
            <div class="text-gray-400">Loading...</div>
        </div>

        <div v-else-if="posts.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
            <span class="text-4xl mb-2">📭</span>
            <p class="text-sm">게시글이 없습니다.</p>
        </div>

        <div v-else class="space-y-4">
            <div 
                v-for="post in posts" 
                :key="post.postId"
                @click="goDetail(post.postId)"
                class="bg-white p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition"
            >
                <!-- User Info -->
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-lg border border-gray-100">
                        <img v-if="post.user.profileImage" :src="post.user.profileImage" class="w-full h-full object-cover">
                        <span v-else>👤</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                             <p class="text-sm font-bold truncate">{{ post.user.userName }}</p>
                             <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ getCategoryLabel(post.category) }}</span>
                        </div>
                        <p class="text-[10px] text-gray-400">{{ formatTime(post.createdAt) }} • 조회 {{ post.viewCount }}</p>
                    </div>
                </div>

                <!-- Title & Content Preview -->
                <h3 class="font-bold text-base mb-1 truncate">{{ post.title }}</h3>
                <p class="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{{ post.content }}</p>

                <!-- Files / Thumbnail (If API provided files list in list view, logic would be roughly: if files.length > 0)
                     But PostDetail includes files, let's assume PostDetail interface is used for list items too as per Service 
                -->
                <div v-if="post.images && post.images.length > 0" class="h-40 bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                    <img 
                        v-if="post.images[0]"
                        :src="post.images[0]" 
                        class="w-full h-full object-cover" 
                        loading="lazy"
                    >
                    <div v-if="post.images.length > 1" class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                        +{{ post.images.length - 1 }}
                    </div>
                </div>

                <!-- Footer (Like / Comment) -->
                <div class="flex items-center gap-4 text-gray-400 text-xs">
                    <div class="flex items-center gap-1">
                        <span :class="post.isLiked ? 'text-red-500' : ''">♥</span> {{ post.likeCount }}
                    </div>
                    <div class="flex items-center gap-1">
                        <span>💬</span> {{ post.commentCount }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="pageInfo && pageInfo.totalPage > 1" class="py-6 flex justify-center gap-2">
             <button 
                @click="changePage(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded border bg-white disabled:opacity-50 text-xs"
             >
                이전
             </button>
             <span class="text-xs flex items-center px-2">{{ currentPage }} / {{ pageInfo.totalPage }}</span>
             <button 
                @click="changePage(currentPage + 1)" 
                :disabled="!pageInfo.hasNext"
                class="px-3 py-1 rounded border bg-white disabled:opacity-50 text-xs"
             >
                다음
             </button>
        </div>

      </main>

      <!-- FAB (Write Button) -->
      <button 
        @click="goWrite"
        class="absolute bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl text-2xl flex items-center justify-center z-30 hover:bg-blue-700 transition active:scale-95"
      >
        ✏️
      </button>

      <!-- Bottom Nav (Placeholder for layout consistency) -->
       <nav class="h-[88px] bg-white border-t flex justify-around pb-6 pt-2 text-[10px] z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] shrink-0">
            <div class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition" @click="router.push('/')">
                <span class="text-2xl mb-1">🏠</span>홈
            </div>

            <div class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition" @click="router.push('/diet')">
                <span class="text-2xl mb-1">🍽️</span>식단
            </div>

            <div class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition">
                <span class="text-2xl mb-1">🔥</span>챌린지
            </div>

            <div class="nav-item flex flex-col items-center cursor-pointer text-blue-600 font-bold transition">
                <span class="text-2xl mb-1">💬</span>커뮤니티
            </div>

            <div class="nav-item flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition" @click="router.push('/profile')">
                <span class="text-2xl mb-1">👤</span>MY
            </div>
      </nav>

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
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  max-height: 100px;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
