<script lang="ts">
export default {
  name: 'FoodDBView',
  beforeRouteEnter(to, from, next) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next((vm: any) => {
      // 다른 화면에서 진입했을 때만 리셋 (상세 화면이나 수정 화면 등에서 돌아온 경우는 유지)
      // /food-create에서 돌아온 경우도 유지하려면 조건 추가 필요하지만, 기본적으로 /food-db 하위가 아니면 리셋
      if (!from.path.startsWith('/food-db/')) {
        vm.resetFilters?.()
      }
    })
  }
}
</script>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onActivated } from 'vue'
import {
  getFoods,
  getFoodCategories,
  type FoodListItem,
  type PageInfo,
} from '@/services/foodService'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Filter, 
  Plus, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Database
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const isSelectMode = computed(() => route.query.mode === 'select')

const goBack = () => {
  router.back()
}

const foods = ref<FoodListItem[]>([])
const pageInfo = ref<PageInfo | null>(null)
const currentPage = ref(1)

const isLoading = ref(true)
const error = ref<string | null>(null)

// --- 검색 필터 상태 ---
const keyword = ref('') // 음식 이름 검색어
const selectedCategory = ref('') // 선택된 카테고리
const userOnly = ref(false) // '내가 만든 음식만' 토글
const categories = ref<string[]>([]) // 전체 카테고리 목록

// --- 카테고리 드롭다운 UI 상태 ---
const categorySearch = ref('') // 카테고리 검색어
const isCategoryDropdownOpen = ref(false)
const isSearchFilterOpen = ref(false)
const categoryWrapper = ref<HTMLElement | null>(null)

const handleCategoryBlur = (event: FocusEvent) => {
  if (categoryWrapper.value && !categoryWrapper.value.contains(event.relatedTarget as Node)) {
    isCategoryDropdownOpen.value = false
  }
}

const selectFood = async (food: FoodListItem) => {
  // 선택 모드여도 상세 페이지로 이동해서 확인 후 추가하도록 변경
  if (isSelectMode.value) {
    router.push({
      path: `/food-db/${food.foodId}`,
      query: { mode: 'select' }
    })
  } else {
    router.push('/food-db/' + food.foodId)
  }
}

const fetchFoods = async (page: number = 1) => {
  try {
    isLoading.value = true
    error.value = null

    const params: {
      page: number
      size: number
      keyword?: string
      category?: string
      userOnly?: boolean
    } = {
      page: page - 1, // API는 page가 0부터 시작
      size: 20,
      keyword: keyword.value || undefined,
      category: selectedCategory.value || undefined,
      userOnly: userOnly.value,
    }

    const response = await getFoods(params)
    foods.value = response.content
    pageInfo.value = response.pageInfo
    currentPage.value = response.pageInfo.pageNo
  } catch (err) {
    error.value = '음식 목록을 불러오는 데 실패했습니다.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 카테고리 목록 불러오기
const fetchCategories = async () => {
  try {
    categories.value = await getFoodCategories()
  } catch (err) {
    console.error('카테고리 목록을 불러오는 데 실패했습니다.', err)
  }
}

// 검색 실행 함수
const handleSearch = () => {
  // 사용자가 카테고리를 직접 입력하고 엔터/검색을 눌렀을 경우 처리
  if (!selectedCategory.value && categorySearch.value) {
    const match = categories.value.find(c => c === categorySearch.value || c.toLowerCase() === categorySearch.value.toLowerCase())
    if (match) {
      selectedCategory.value = match
    }
  }
  // 검색 시 1페이지부터 결과 조회
  fetchFoods()
}

const goToPage = (page: number) => {
  if (page > 0 && pageInfo.value && page <= pageInfo.value.totalPage && page !== pageInfo.value.pageNo) {
    fetchFoods(page)
  }
}

const filteredCategories = computed(() => {
  if (!categorySearch.value) {
    return categories.value
  }
  return categories.value.filter((c) => c.toLowerCase().includes(categorySearch.value.toLowerCase()))
})

watch(userOnly, () => {
  fetchFoods()
})

const selectCategory = (category: string) => {
  selectedCategory.value = category
  categorySearch.value = category // 입력창에도 선택된 값 표시
  isCategoryDropdownOpen.value = false
  fetchFoods()
}

// 컴포넌트가 마운트될 때 카테고리 목록을 가져옵니다.
onMounted(() => {
  fetchCategories()
})

const resetFilters = () => {
    keyword.value = ''
    selectedCategory.value = ''
    categorySearch.value = ''
    isSearchFilterOpen.value = false
    foods.value = [] // Reset result list too for fresh start
}

defineExpose({
    resetFilters
})

// 컴포넌트를 떠날 때 필터 초기화 여부 결정
onBeforeRouteLeave((to, from, next) => {
  // 상세 화면(/food-db/...)이나 음식 수정(/food-db/edit/...),
  // 또는 음식 등록(/food-create)이 아니라면 필터를 초기화
  // (음식 등록으로 갔다가 취소하고 오면 필터가 유지되는게 일반적이지만,
  //  사용자 요청은 "음식 상세에 들어갔다가 나왔을 경우만 유지"이므로 상세 제외 모두 리셋 처리)
  if (!to.path.startsWith('/food-db/')) {
    resetFilters()
  }
  next()
})

// 컴포넌트가 활성화될 때 (다시 보여질 때) 음식 목록을 가져옵니다.
onActivated(() => {
  fetchFoods(currentPage.value)
})
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">음식 사전</h1>
        <div class="w-12 flex justify-end">
          <button 
            @click="router.push('/food-create')" 
            class="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg transition"
          >
            등록
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex flex-col flex-1 overflow-hidden bg-slate-50">
        <!-- 필터 토글 버튼 영역 -->
        <div class="px-6 pt-4 pb-2 bg-slate-50 relative z-20">
          <button 
            @click="isSearchFilterOpen = !isSearchFilterOpen" 
            class="w-full flex justify-between items-center text-left text-sm font-bold text-slate-600 focus:outline-none bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-primary-200 transition"
             :class="{ 'border-b-0 rounded-b-none': isSearchFilterOpen }"
          >
            <span class="flex items-center gap-2"><Filter :size="16" class="text-slate-400" />검색 및 필터</span>
            <ChevronDown :size="16" class="transform transition-transform duration-300" :class="{ 'rotate-180': isSearchFilterOpen }" />
          </button>
        </div>

        <!-- 검색 폼 영역 -->
        <transition name="slide">
          <div v-if="isSearchFilterOpen" class="px-6 pb-6 pt-0 bg-slate-50 relative z-10">
            <div class="bg-white p-4 rounded-b-xl border border-t-0 border-slate-200 shadow-sm space-y-4">
               <form @submit.prevent="handleSearch" class="space-y-4">
                <!-- 음식 이름 검색 -->
                <div class="relative">
                <input
                    v-model="keyword"
                    type="text"
                    placeholder="음식 이름으로 검색"
                    class="w-full h-11 border border-slate-200 rounded-xl pl-10 pr-4 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition text-sm"
                />
                <div class="absolute left-3 top-3 text-slate-400">
                    <Search :size="16" />
                </div>
                </div>

                <!-- 카테고리 검색 -->
                <div class="relative" ref="categoryWrapper" @focusout="handleCategoryBlur">
                <input
                    v-model="categorySearch"
                    type="text"
                    placeholder="카테고리 검색 또는 선택"
                    class="w-full h-11 border border-slate-200 rounded-xl pl-4 pr-10 bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition text-sm"
                    @focus="isCategoryDropdownOpen = true"
                    @input="selectedCategory = ''"
                />
                 <div class="absolute right-3 top-3 text-slate-400 pointer-events-none">
                    <ChevronDown :size="16" />
                </div>
                
                <transition name="fade">
                    <div
                        v-if="isCategoryDropdownOpen"
                        class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto no-scrollbar"
                    >
                        <div
                        v-for="cat in filteredCategories"
                        :key="cat"
                        @mousedown.prevent="selectCategory(cat)"
                        class="px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer border-b border-slate-50 last:border-0"
                        >
                        {{ cat }}
                        </div>
                        <div v-if="filteredCategories.length === 0" class="px-4 py-3 text-sm text-slate-400 text-center">
                        결과 없음
                        </div>
                    </div>
                </transition>
                </div>

                <!-- 내가 만든 음식만 보기 -->
                <label class="flex items-center justify-between cursor-pointer group">
                <span class="text-sm font-bold text-slate-600 group-hover:text-primary-600 transition">내가 만든 음식만 보기</span>
                <div class="relative">
                    <input type="checkbox" v-model="userOnly" class="sr-only" />
                    <div class="block bg-slate-200 w-11 h-6 rounded-full transition-colors" :class="{ '!bg-primary-500': userOnly }"></div>
                    <div
                      class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm flex items-center justify-center"
                      :class="{ 'translate-x-5': userOnly }"
                    >
                    </div>
                </div>
                </label>

                <button
                type="submit"
                class="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:brightness-110 transition shadow-md shadow-primary-200"
                >
                검색하기
                </button>
            </form>
            </div>
          </div>
        </transition>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center flex-1 py-10">
          <Loader2 class="animate-spin text-primary-500 mb-2" :size="32" />
          <p class="text-sm text-slate-500">데이터를 불러오는 중입니다...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="flex flex-col items-center justify-center flex-1 py-10 text-rose-500 gap-2">
            <div class="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">!</div>
            <p class="text-sm font-medium">{{ error }}</p>
        </div>

        <!-- 데이터 표시 -->
        <div v-else class="flex-1 overflow-y-auto px-6 pb-6 bg-slate-50 no-scrollbar">
          <div v-if="foods.length > 0" class="space-y-4 pt-2">
            <h3 class="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">
                <span v-if="keyword || selectedCategory">검색 결과 {{ pageInfo?.totalCount }}건</span>
                <span v-else>전체 음식 목록</span>
            </h3>
            <div
              v-for="food in foods"
              :key="food.foodId"
              @click="selectFood(food)"
              class="flex items-center justify-between p-5 border border-slate-100 rounded-3xl bg-white hover:bg-slate-50 hover:border-primary-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div class="flex-1 z-10">
                <h4 class="font-bold text-sm text-slate-800 mb-0.5 group-hover:text-primary-700 transition-colors">
                  {{ food.foodName }} 
                  <span class="text-xs font-normal text-slate-500 ml-1">({{ food.servingSize }}{{ food.unit }})</span>
                </h4>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{{ food.category }}</span>
                </div>
              </div>
              <div class="flex flex-col items-end z-10">
                  <span class="text-sm font-bold text-slate-700"
                    >{{ Math.round(food.calories) }} <span class="text-xs font-normal text-slate-400">kcal</span></span
                  >
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Database :size="32" class="text-slate-300" />
            </div>
            <div class="text-center">
                <p class="font-bold text-slate-600 mb-1">검색 결과가 없습니다.</p>
                <p class="text-xs">찾으시는 음식이 없다면 직접 등록해보세요!</p>
            </div>
            <button
              @click="router.push('/food-create')"
              class="mt-2 px-5 py-2.5 bg-primary-50 text-primary-600 text-sm font-bold rounded-xl hover:bg-primary-100 transition flex items-center gap-2"
            >
              <Plus :size="16" /> 새로운 음식 등록하기
            </button>
          </div>
        </div>


        <!-- Pagination -->
        <div
          v-if="pageInfo && pageInfo.totalPage > 1"
          class="flex justify-center items-center p-4 border-t border-slate-100 bg-white"
        >
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft :size="20" />
          </button>

          <span class="text-sm font-bold text-slate-700 mx-6 font-mono">
            {{ currentPage }} / {{ pageInfo.totalPage }}
          </span>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="!pageInfo.hasNext"
            class="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </main>
    </div>
</template>

<style scoped>
/* 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  max-height: 500px;
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
