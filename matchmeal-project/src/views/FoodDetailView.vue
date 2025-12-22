<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFoodDetail, deleteFood, type FoodDetail } from '@/services/foodService'
import { useDietStore } from '@/stores/dietStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToastStore } from '@/stores/toast'
import { 
  ArrowLeft, 
  Trash2, 
  Edit2, 
  Utensils, 
  Flame, 
  Loader2 
} from 'lucide-vue-next'

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
      toastStore.show('음식 삭제에 실패했습니다.', 'error')
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
    sodium: food.value.sodium,
  })

  // router.push('/diet/record') 대신, 히스토리 스택을 2단계 뒤로 이동하여
  // (DietRecordView -> FoodDBView -> FoodDetailView) 순서를 거슬러 올라감
  router.go(-2)
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <!-- 모바일 프레임 -->
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">음식 정보</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 class="animate-spin text-primary-500" :size="32" />
            <span class="text-sm">불러오는 중...</span>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-rose-500 gap-2">
           <div class="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">!</div>
           <p class="text-sm font-bold">{{ error }}</p>
        </div>

        <!-- 데이터 표시 -->
        <div v-else-if="food" class="p-6">
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
                <div class="flex justify-between items-start mb-2">
                <h2 class="text-xl font-bold text-slate-800 line-clamp-2 leading-tight">{{ food.foodName }}</h2>
                <span class="bg-primary-50 text-primary-700 px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ml-2 shadow-sm">{{
                    food.category
                }}</span>
                </div>
                <p class="text-xs text-slate-400 font-medium mb-6 flex items-center gap-1">
                    <Utensils :size="12" /> {{ food.servingSize }}{{ food.unit }} 기준
                </p>

                <div class="flex items-center gap-2 mb-6">
                    <Flame :size="24" class="text-orange-500 fill-orange-500" />
                    <span class="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {{ Math.round(food.calories) }}<span class="text-base font-medium text-slate-400 ml-1">kcal</span>
                    </span>
                </div>

                <!-- 영양 정보 그리드 -->
                <div class="h-px bg-slate-100 my-4"></div>
                
                <div class="grid grid-cols-3 gap-y-6 text-center">
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 mb-1">탄수화물</div>
                        <div class="font-bold text-base text-slate-700">{{ food.carbohydrate }}<span class="text-xs font-normal text-slate-400">g</span></div>
                    </div>
                    <div class="border-x border-slate-100">
                        <div class="text-[10px] font-bold text-slate-400 mb-1">단백질</div>
                        <div class="font-bold text-base text-slate-700">{{ food.protein }}<span class="text-xs font-normal text-slate-400">g</span></div>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 mb-1">지방</div>
                        <div class="font-bold text-base text-slate-700">{{ food.fat }}<span class="text-xs font-normal text-slate-400">g</span></div>
                    </div>
                    
                    <div class="col-span-3 flex justify-evenly pt-2 border-t border-slate-50">
                        <div>
                            <div class="text-[10px] font-bold text-slate-400 mb-1">당류</div>
                            <div class="font-bold text-sm text-slate-600">{{ food.sugars ?? '-' }}<span class="text-[10px] font-normal text-slate-400">g</span></div>
                        </div>
                        <div>
                            <div class="text-[10px] font-bold text-slate-400 mb-1">나트륨</div>
                            <div class="font-bold text-sm text-slate-600">{{ food.sodium ?? '-' }}<span class="text-[10px] font-normal text-slate-400">mg</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 하단 버튼 영역 -->
            <div>
              <!-- 선택 모드일 때: 식단에 추가 버튼 -->
              <button
                v-if="isSelectMode"
                @click="addToDiet"
                class="w-full h-14 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
              >
                <Utensils :size="20" stroke-width="2.5" /> 이 음식 추가하기
              </button>

              <!-- 일반 모드이고 내 음식일 때: 수정/삭제 -->
              <div v-else-if="food.isMine" class="flex gap-3 mt-auto">
                <button
                  @click="handleDeleteClick"
                  class="flex-1 h-12 border border-rose-100 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 :size="18" /> 삭제
                </button>
                <button
                  @click="handleEdit"
                  class="flex-[2] h-12 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Edit2 :size="18" /> 수정하기
                </button>
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

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
