<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFoods, type FoodListItem, type PageInfo } from '@/services/foodService';
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.push('/home');
};

const foods = ref<FoodListItem[]>([]);
const pageInfo = ref<PageInfo | null>(null);
const currentPage = ref(1);
const keyword = ref(''); // 검색어 상태 추가

const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchFoods = async (page: number) => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const params: { page: number; size: number; keyword?: string } = {
        page: page - 1, // API는 page가 0부터 시작
        size: 20
    };

    if (keyword.value) {
        params.keyword = keyword.value;
    }

    const response = await getFoods(params);
    foods.value = response.content;
    pageInfo.value = response.pageInfo;
    currentPage.value = response.pageInfo.pageNo;
  } catch (err) {
    error.value = '음식 목록을 불러오는 데 실패했습니다.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// 검색 실행 함수
const handleSearch = () => {
    // 검색 시 1페이지부터 결과 조회
    fetchFoods(1);
}

const goToPage = (page: number) => {
  if (page > 0 && pageInfo.value && page <= pageInfo.value.totalPage) {
    fetchFoods(page);
  }
}

// 컴포넌트가 마운트될 때 첫 페이지 데이터를 가져옵니다.
onMounted(() => {
  fetchFoods(currentPage.value);
});
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <!-- 모바일 프레임 -->
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">음식 사전</h1>
        <div class="w-12 flex justify-end">
          <button @click="router.push('/food-create')" class="text-sm font-bold text-blue-600">등록</button>
        </div> 
      </header>

      <!-- Main Content -->
      <main class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 bg-gray-50">
            <form @submit.prevent="handleSearch" class="relative">
              <input v-model="keyword" type="text" placeholder="궁금한 음식을 검색해보세요" class="w-full h-12 border border-gray-300 rounded-full pl-5 pr-12 bg-white focus:outline-none focus:border-blue-500">
              <button type="submit" class="absolute right-4 top-3 text-gray-400 text-lg hover:text-blue-600">🔍</button>
            </form>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="text-center text-gray-500 py-10">
          <p>데이터를 불러오는 중입니다...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="text-center text-red-500 py-10">
          <p>{{ error }}</p>
        </div>
        
        <!-- 데이터 표시 -->
        <div v-else class="flex-1 overflow-y-auto px-6 pb-6 bg-gray-50">
          <h3 class="font-bold text-sm mb-3 text-gray-700">
              <span v-if="keyword">'{{ keyword }}' 검색 결과</span>
              <span v-else>음식 목록</span>
          </h3>
          <div v-if="foods.length > 0" class="space-y-3">
            <router-link v-for="food in foods" :key="food.foodId" :to="'/food/' + food.foodId" class="flex items-center gap-4 p-3 border rounded-xl hover:bg-gray-100 bg-white">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">🍎</div>
              <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">{{ food.foodName }} ({{ food.servingSize }}{{ food.unit }})</h4>
                <p class="text-xs text-gray-500">{{ food.category }}</p>
              </div>
              <span class="text-sm font-bold text-gray-700">{{ Math.round(food.calories) }} kcal</span>
            </router-link>
          </div>
          <div v-else class="text-center text-gray-500 py-10">
            <p>검색 결과가 없습니다.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pageInfo && pageInfo.totalPage > 1" class="flex justify-center items-center p-4 border-t bg-white">
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
/* 필요한 경우 여기에 특정 스타일을 추가합니다. */
</style>
