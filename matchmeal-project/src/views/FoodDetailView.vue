<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFoodDetail, deleteFood, type FoodDetail } from '@/services/foodService'
import { useDietStore } from '@/stores/dietStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const dietStore = useDietStore()
const toastStore = useToastStore()

const isSelectMode = computed(() => route.query.mode === 'select')

const food = ref<FoodDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Modal State
const isDeleteModalOpen = ref(false)

const fetchFood = async () => {
  try {
    const foodId = Number(route.params.id)
    if (isNaN(foodId)) {
      throw new Error('유효하지 않은 음식 ID입니다.')
    }
    isLoading.value = true
    error.value = null
    // API 응답에 isMine 대신 mine이 포함될 수 있으므로 변환합니다.
    const responseData = (await getFoodDetail(foodId)) as FoodDetail & {
      mine?: boolean
    }
    if (responseData && typeof responseData.mine !== 'undefined') {
      responseData.isMine = responseData.mine
      delete responseData.mine
    }
    food.value = responseData
  } catch (err) {
    error.value = '음식 정보를 불러오는 데 실패했습니다.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchFood)

const goBack = () => {
  router.back()
}

const handleEdit = () => {
  if (food.value) {
    router.push(`/food-db/edit/${food.value.foodId}`)
  }
}

const handleDeleteClick = () => {
    isDeleteModalOpen.value = true
}

const handleConfirmDelete = async () => {
  if (food.value) {
    try {
      await deleteFood(food.value.foodId)
      toastStore.show('음식이 삭제되었습니다.')
      router.back()
    } catch (err) {
      alert('음식 삭제에 실패했습니다.')
      console.error(err)
    } finally {
        isDeleteModalOpen.value = false
    }
  }
}

const addToDiet = () => {
    if (!food.value) return

    dietStore.addFoodToDiet({
        foodId: food.value.foodId,
        foodName: food.value.foodName,
        quantity: food.value.servingSize,
        unit: food.value.unit,
        calories: food.value.calories,
        carbohydrate: food.value.carbohydrate,
        protein: food.value.protein,
        fat: food.value.fat,
        sugars: food.value.sugars,
        sodium: food.value.sodium
    })
    
    // router.push('/diet/record') 대신, 히스토리 스택을 2단계 뒤로 이동하여
    // (DietRecordView -> FoodDBView -> FoodDetailView) 순서를 거슬러 올라감
    // 이렇게 하면 DietRecordView로 돌아갔을 때 '뒤로 가기'를 누르면 MainView로 정상 이동됨
    router.go(-2)
}
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
        <h1 class="font-bold text-lg truncate">
          {{ isLoading ? '로딩 중...' : food?.foodName || '상세 정보' }}
        </h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="text-center text-gray-500 py-20">
          <p>데이터를 불러오는 중입니다...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="text-center text-red-500 py-20">
          <p>{{ error }}</p>
        </div>

        <!-- 데이터 표시 -->
        <div v-else-if="food" class="bg-white">
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h2 class="text-2xl font-bold">{{ food.foodName }}</h2>
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{{
                food.category
              }}</span>
            </div>
            <p class="text-sm text-gray-500 mb-6">{{ food.servingSize }}{{ food.unit }} 기준</p>

            <!-- 영양 정보 그리드 -->
            <div class="grid grid-cols-2 gap-3 mb-8 text-left">
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">칼로리</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.calories }} <span class="text-sm font-normal">kcal</span></span
                >
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">탄수화물</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.carbohydrate }} <span class="text-sm font-normal">g</span></span
                >
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">단백질</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.protein }} <span class="text-sm font-normal">g</span></span
                >
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">지방</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.fat }} <span class="text-sm font-normal">g</span></span
                >
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">총 당류</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.sugars ?? '-' }} <span class="text-sm font-normal">g</span></span
                >
              </div>
              <div class="p-4 bg-gray-50 rounded-xl">
                <span class="block text-xs text-gray-500 mb-1">나트륨</span>
                <span class="font-bold text-xl text-gray-800"
                  >{{ food.sodium ?? '-' }} <span class="text-sm font-normal">mg</span></span
                >
              </div>
            </div>

            <!-- 하단 버튼 영역 -->
            <div class="mt-10">
                <!-- 선택 모드일 때: 식단에 추가 버튼 -->
                <button
                    v-if="isSelectMode"
                    @click="addToDiet"
                    class="w-full h-12 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                    <span>🍽️</span> 이 음식을 식단에 추가하기
                </button>

                <!-- 일반 모드이고 내 음식일 때: 수정/삭제 -->
                <div v-else-if="food.isMine" class="flex gap-3">
                    <button
                        @click="handleDeleteClick"
                        class="flex-1 h-12 border-2 border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
                    >
                        삭제
                    </button>
                    <button
                        @click="handleEdit"
                        class="flex-[2] h-12 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition"
                    >
                        수정하기
                    </button>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Confirm Modal -->
  <ConfirmModal
    :is-open="isDeleteModalOpen"
    title="음식 삭제"
    :message="`'${food?.foodName}'을(를) 정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`"
    confirm-text="삭제"
    @close="isDeleteModalOpen = false"
    @confirm="handleConfirmDelete"
  />
</template>
