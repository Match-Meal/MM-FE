<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getFoodDetail,
  updateFood,
  type FoodDetail,
  type UpdateFoodPayload,
} from '@/services/foodService'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const foodId = Number(route.params.id)

// 폼 입력을 위한 반응형 객체
const foodData = ref<UpdateFoodPayload>({
  foodName: '',
  category: '',
  servingSize: undefined,
  unit: 'g',
  calories: undefined,
  carbohydrate: undefined,
  protein: undefined,
  fat: undefined,
})

// 원본 FoodDetail 데이터 저장을 위한 ref
const originalFoodDetail = ref<FoodDetail | null>(null)

const error = ref<string | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// 기존 음식 데이터 불러오기
onMounted(async () => {
  if (isNaN(foodId)) {
    error.value = '유효하지 않은 음식 ID입니다.'
    isLoading.value = false
    return
  }
  try {
    const existingFood = (await getFoodDetail(foodId)) as FoodDetail & {
      mine?: boolean
    }
    if (existingFood && typeof existingFood.mine !== 'undefined') {
      existingFood.isMine = existingFood.mine
      delete existingFood.mine
    }

    if (!existingFood.isMine) {
      toastStore.show('수정 권한이 없습니다.', 'error')
      router.back()
      return
    }
    
    originalFoodDetail.value = existingFood

    foodData.value = {
      foodName: existingFood.foodName,
      category: existingFood.category,
      servingSize: existingFood.servingSize,
      unit: existingFood.unit,
      calories: existingFood.calories,
      carbohydrate: existingFood.carbohydrate,
      protein: existingFood.protein,
      fat: existingFood.fat,
      sugars: existingFood.sugars,
      sodium: existingFood.sodium,
    }
  } catch (err) {
    error.value = '음식 정보를 불러오는 데 실패했습니다.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
})

// 폼 제출 핸들러
const handleSubmit = async () => {
  if (!foodData.value.foodName) {
    error.value = '음식 이름은 필수입니다.'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    if (!originalFoodDetail.value) {
      throw new Error('원본 데이터가 없습니다.')
    }

    const processedData = { ...foodData.value }

    const numericKeys: (keyof UpdateFoodPayload)[] = [
      'servingSize',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
      'sugars',
      'sodium',
    ]
    numericKeys.forEach((key) => {
      if (processedData[key] === '') {
        processedData[key] = undefined
      }
    })

    const updateKeys: (keyof UpdateFoodPayload)[] = [
      'foodName',
      'category',
      'servingSize',
      'unit',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
      'sugars',
      'sodium',
    ]
    const payload = updateKeys.reduce<Partial<UpdateFoodPayload>>((acc, key) => {
      const originalValue = originalFoodDetail.value![key]
      const processedValue = processedData[key]

      if (
        !(originalValue === processedValue || (originalValue == null && processedValue == null))
      ) {
        ;(acc as Record<typeof key, typeof processedValue>)[key] = processedValue
      }
      return acc
    }, {} as Partial<UpdateFoodPayload>)

    if (Object.keys(payload).length === 0) {
      router.replace(`/food-db/${foodId}`)
      return
    }

    await updateFood(foodId, payload as Partial<UpdateFoodPayload>)
    toastStore.show('음식이 수정되었습니다.')
    router.back()
  } catch (err) {
    error.value = '음식 수정에 실패했습니다. 다시 시도해주세요.'
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">음식 정보 수정</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Form Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
           <Loader2 class="animate-spin text-primary-500" :size="32" />
           <span class="text-xs">데이터를 불러오는 중...</span>
        </div>
        
        <div v-else-if="error" class="bg-rose-50 text-rose-500 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-4">
             <div class="w-4 h-4 rounded-full bg-rose-200 flex items-center justify-center text-[10px] font-bold">!</div>
            {{ error }}
        </div>
        
        <form v-else @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="foodName" class="block text-xs font-bold text-slate-500 mb-1.5"
              >음식 이름 <span class="text-rose-500">*</span></label
            >
            <input
              v-model="foodData.foodName"
              type="text"
              id="foodName"
              class="input-field"
              required
            />
          </div>

          <div>
             <label for="category" class="block text-xs font-bold text-slate-500 mb-1.5"
                >카테고리</label
              >
            <input
              v-model="foodData.category"
              type="text"
              id="category"
              class="input-field"
              readonly
              disabled
            />
            <p class="text-[10px] text-slate-400 mt-1 pl-1">카테고리는 수정할 수 없습니다.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="servingSize" class="block text-xs font-bold text-slate-500 mb-1.5"
                >1회 제공량</label
              >
              <input
                v-model.number="foodData.servingSize"
                type="number"
                step="0.1"
                id="servingSize"
                class="input-field"
              />
            </div>
            <div>
              <label for="unit" class="block text-xs font-bold text-slate-500 mb-1.5">단위</label>
              <input
                v-model="foodData.unit"
                type="text"
                id="unit"
                class="input-field"
              />
            </div>
          </div>

          <div class="h-px bg-slate-200 my-6"></div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="calories" class="block text-xs font-bold text-slate-500 mb-1.5"
                >칼로리 (kcal)</label
              >
              <input
                v-model.number="foodData.calories"
                type="number"
                step="0.1"
                id="calories"
                class="input-field"
              />
            </div>
            <div>
              <label for="carbohydrate" class="block text-xs font-bold text-slate-500 mb-1.5"
                >탄수화물 (g)</label
              >
              <input
                v-model.number="foodData.carbohydrate"
                type="number"
                step="0.1"
                id="carbohydrate"
                class="input-field"
              />
            </div>
            <div>
              <label for="protein" class="block text-xs font-bold text-slate-500 mb-1.5"
                >단백질 (g)</label
              >
              <input
                v-model.number="foodData.protein"
                type="number"
                step="0.1"
                id="protein"
                class="input-field"
              />
            </div>
            <div>
              <label for="fat" class="block text-xs font-bold text-slate-500 mb-1.5">지방 (g)</label>
              <input
                v-model.number="foodData.fat"
                type="number"
                step="0.1"
                id="fat"
                class="input-field"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-1">
            <div>
              <label for="sugars" class="block text-xs font-bold text-slate-500 mb-1.5"
                >총 당류 (g)</label
              >
              <input
                v-model.number="foodData.sugars"
                type="number"
                step="0.1"
                id="sugars"
                class="input-field"
              />
            </div>
            <div>
              <label for="sodium" class="block text-xs font-bold text-slate-500 mb-1.5"
                >나트륨 (mg)</label
              >
              <input
                v-model.number="foodData.sodium"
                type="number"
                step="0.1"
                id="sodium"
                class="input-field"
              />
            </div>
          </div>

          <div class="pt-6">
            <button
              type="submit"
              :disabled="isSubmitting || isLoading"
              class="w-full h-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              <Loader2 v-if="isSubmitting" class="animate-spin mr-2" :size="20" />
              <span v-else>수정하기</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
