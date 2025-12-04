<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getFoodDetail,
  updateFood,
  type FoodDetail,
  type UpdateFoodPayload,
} from '@/services/foodService'

const route = useRoute()
const router = useRouter()
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
    // API 응답에 isMine 대신 mine이 포함될 수 있으므로 변환합니다.
    const existingFood = (await getFoodDetail(foodId)) as FoodDetail & {
      mine?: boolean
    }
    if (existingFood && typeof existingFood.mine !== 'undefined') {
      existingFood.isMine = existingFood.mine
      delete existingFood.mine
    }

    // isMine이 false이면 수정 권한이 없으므로 되돌려 보냄
    if (!existingFood.isMine) {
      alert('수정 권한이 없습니다.')
      router.back()
      return
    }
    // 원본 데이터 전체를 저장
    originalFoodDetail.value = existingFood

    // 폼 데이터(foodData)에는 UpdateFoodPayload에 해당하는 필드만 매핑
    foodData.value = {
      foodName: existingFood.foodName,
      category: existingFood.category,
      servingSize: existingFood.servingSize,
      unit: existingFood.unit,
      calories: existingFood.calories,
      carbohydrate: existingFood.carbohydrate,
      protein: existingFood.protein,
      fat: existingFood.fat,
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

    // Create a mutable copy for processing
    const processedData = { ...foodData.value }

    // 1. Convert empty strings in numeric fields to undefined for consistency
    const numericKeys: (keyof UpdateFoodPayload)[] = [
      'servingSize',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
    ]
    numericKeys.forEach((key) => {
      if (processedData[key] === '') {
        processedData[key] = undefined
      }
    })

    // 2. Compare with original data to build the final payload
    // Define keys that are part of the update payload to ensure type safety.
    const updateKeys: (keyof UpdateFoodPayload)[] = [
      'foodName',
      'category',
      'servingSize',
      'unit',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
    ]
    const payload = updateKeys.reduce<Partial<UpdateFoodPayload>>((acc, key) => {
      const originalValue = originalFoodDetail.value![key]
      const processedValue = processedData[key]

      // Treat null and undefined as the same to avoid unnecessary updates.
      if (
        !(originalValue === processedValue || (originalValue == null && processedValue == null))
      ) {
        ;(acc as Record<typeof key, typeof processedValue>)[key] = processedValue
      }
      return acc
    }, {} as Partial<UpdateFoodPayload>)

    // Do not submit if there are no changes
    if (Object.keys(payload).length === 0) {
      // Optionally, inform the user that no changes were made.
      // alert('변경된 내용이 없습니다.');
      router.replace(`/food-db/${foodId}`) // Go back to detail page
      return
    }

    await updateFood(foodId, payload as Partial<UpdateFoodPayload>)
    // 성공 시 상세 페이지로 이동
    router.replace(`/food-db/${foodId}`)
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
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">음식 정보 수정</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Form Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div v-if="isLoading" class="text-center text-gray-500 py-20">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
        <div v-else-if="error" class="text-center text-red-500 py-20">
          <p>{{ error }}</p>
        </div>
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="foodName" class="block text-sm font-bold text-gray-600 mb-1"
              >음식 이름 <span class="text-red-500">*</span></label
            >
            <input
              v-model="foodData.foodName"
              type="text"
              id="foodName"
              class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label for="category" class="block text-sm font-bold text-gray-600 mb-1"
              >카테고리</label
            >
            <input
              v-model="foodData.category"
              type="text"
              id="category"
              class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="servingSize" class="block text-sm font-bold text-gray-600 mb-1"
                >1회 제공량</label
              >
              <input
                v-model.number="foodData.servingSize"
                type="number"
                step="0.1"
                id="servingSize"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label for="unit" class="block text-sm font-bold text-gray-600 mb-1">단위</label>
              <input
                v-model="foodData.unit"
                type="text"
                id="unit"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <hr class="my-6" />

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="calories" class="block text-sm font-bold text-gray-600 mb-1"
                >칼로리 (kcal)</label
              >
              <input
                v-model.number="foodData.calories"
                type="number"
                step="0.1"
                id="calories"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label for="carbohydrate" class="block text-sm font-bold text-gray-600 mb-1"
                >탄수화물 (g)</label
              >
              <input
                v-model.number="foodData.carbohydrate"
                type="number"
                step="0.1"
                id="carbohydrate"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label for="protein" class="block text-sm font-bold text-gray-600 mb-1"
                >단백질 (g)</label
              >
              <input
                v-model.number="foodData.protein"
                type="number"
                step="0.1"
                id="protein"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label for="fat" class="block text-sm font-bold text-gray-600 mb-1">지방 (g)</label>
              <input
                v-model.number="foodData.fat"
                type="number"
                step="0.1"
                id="fat"
                class="w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div v-if="error" class="text-red-500 text-sm mt-2">
            {{ error }}
          </div>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="isSubmitting || isLoading"
              class="w-full h-12 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400"
            >
              <span v-if="isSubmitting">수정 중...</span>
              <span v-else>수정하기</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>
