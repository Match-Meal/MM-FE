<script lang="ts">
export default {
  name: 'FoodDBView',
  beforeRouteEnter(to, from, next) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next((vm: any) => {
      // 다른 화면에서 진입했을 때만 리셋 (상세 화면이나 수정 화면 등에서 돌아온 경우는 유지)
      // /food-create에서 돌아온 경우도 유지하려면 조건 추가 필요하지만, 기본적으로 /food-db 하위가 아니면 리셋
      if (!from.path.startsWith('/food-db/')) {
        vm.resetFilters && vm.resetFilters()
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
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <!-- 모바일 프레임 -->
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">음식 사전</h1>
        <div class="w-12 flex justify-end">
          <button @click="router.push('/food-create')" class="text-sm font-bold text-blue-600">
            등록
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex flex-col flex-1 overflow-hidden">
        <!-- 필터 토글 버튼 영역 -->
        <div class="px-6 pt-4 pb-2 bg-gray-50" :class="!isSearchFilterOpen ? 'border-b' : ''">
          <button @click="isSearchFilterOpen = !isSearchFilterOpen" class="w-full flex justify-between items-center text-left text-sm font-bold text-gray-600 focus:outline-none">
            <span>검색 및 필터</span>
            <span class="transform transition-transform duration-300" :class="{ 'rotate-180': isSearchFilterOpen }">▼</span>
          </button>
        </div>

        <!-- 검색 폼 영역 -->
        <transition name="slide">
          <div v-if="isSearchFilterOpen" class="p-6 bg-gray-50 border-b">
            <form @submit.prevent="handleSearch" class="space-y-4">
            <!-- 음식 이름 검색 -->
            <div class="relative">
              <input
                v-model="keyword"
                type="text"
                placeholder="음식 이름으로 검색"
                class="w-full h-12 border border-gray-300 rounded-lg pl-5 pr-12 bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                class="absolute right-4 top-3 text-gray-400 text-lg hover:text-blue-600"
              >
                🔍
              </button>
            </div>

            <!-- 카테고리 검색 -->
            <div class="relative" ref="categoryWrapper" @focusout="handleCategoryBlur">
              <input
                v-model="categorySearch"
                type="text"
                placeholder="카테고리 검색 또는 선택"
                class="w-full h-12 border border-gray-300 rounded-lg pl-5 pr-12 bg-white focus:outline-none focus:border-blue-500"
                @focus="isCategoryDropdownOpen = true"
                @input="selectedCategory = ''"
              />
              <div
                v-if="isCategoryDropdownOpen"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="cat in filteredCategories"
                  :key="cat"
                  @mousedown.prevent="selectCategory(cat)"
                  class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {{ cat }}
                </div>
                <div v-if="filteredCategories.length === 0" class="px-4 py-2 text-sm text-gray-400">
                  결과 없음
                </div>
              </div>
            </div>

            <!-- 내가 만든 음식만 보기 -->
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm font-medium text-gray-700">내가 만든 음식만 보기</span>
              <div class="relative">
                <input type="checkbox" v-model="userOnly" class="sr-only" />
                <div class="block bg-gray-200 w-12 h-7 rounded-full transition"></div>
                <div
                  class="dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition"
                ></div>
              </div>
            </label>

            <input
              type="submit"
              class="w-full h-12 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              value="검색하기"
            />
          </form>
        </div>
        </transition>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="text-center text-gray-500 py-10 bg-gray-50 flex-1">
          <p>데이터를 불러오는 중입니다...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="text-center text-red-500 py-10 bg-gray-50 flex-1">
          <p>{{ error }}</p>
        </div>

        <!-- 데이터 표시 -->
        <div v-else class="flex-1 overflow-y-auto px-6 pb-6 bg-gray-50">
          <h3 class="font-bold text-sm my-4 text-gray-700">
            <span v-if="keyword || selectedCategory">검색 결과</span>
            <span v-else>전체 음식 목록</span>
          </h3>
          <div v-if="foods.length > 0" class="space-y-3">
            <div
              v-for="food in foods"
              :key="food.foodId"
              @click="selectFood(food)"
              class="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-100 bg-white cursor-pointer"
            >
              <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">
                  {{ food.foodName }} ({{ food.servingSize }}{{ food.unit }})
                </h4>
                <p class="text-xs text-gray-500">{{ food.category }}</p>
              </div>
              <span class="text-sm font-bold text-gray-700 pl-4"
                >{{ Math.round(food.calories) }} kcal</span
              >
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-10">
            <p>검색 결과가 없습니다.</p>
            <button
              @click="router.push('/food-create')"
              class="mt-4 px-4 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 transition"
            >
              새로운 음식 등록하기
            </button>
          </div>
        </div>


        <!-- Pagination -->
        <div
          v-if="pageInfo && pageInfo.totalPage > 1"
          class="flex justify-center items-center p-4 border-t bg-white"
        >
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <span class="text-sm text-gray-600 mx-4">
            {{ currentPage }} / {{ pageInfo.totalPage }}
          </span>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="!pageInfo.hasNext"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out;
  overflow: hidden;
  max-height: 500px; /* 콘텐츠 최대 높이보다 큰 값 */
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* '내가 만든 음식만 보기' 토글 스위치 스타일 */
input:checked ~ .dot {
  transform: translateX(1.25rem);
  background-color: #fff;
}
input:checked ~ .block {
  background-color: #3b82f6; /* blue-500 */
}
</style>
