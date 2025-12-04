<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createFood, type CreateFoodPayload } from '@/services/foodService'

const router = useRouter()

// 폼 입력을 위한 반응형 객체
const foodData = ref<CreateFoodPayload>({
  foodName: '',
  category: '',
  servingSize: undefined,
  unit: 'g',
  calories: undefined,
  carbohydrate: undefined,
  protein: undefined,
  fat: undefined,
})

const error = ref<string | null>(null)
const isSubmitting = ref(false)

// 폼 제출 핸들러
const handleSubmit = async () => {
  if (!foodData.value.foodName) {
    error.value = '음식 이름은 필수입니다.'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    // 1. Create a mutable copy of the form data.
    const payload: Partial<CreateFoodPayload> = { ...foodData.value }

    // 2. Convert empty strings in numeric fields to undefined.
    const numericKeys: (keyof CreateFoodPayload)[] = [
      'servingSize',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
    ]
    numericKeys.forEach((key) => {
      if (payload[key] === '') {
        payload[key] = undefined
      }
    })

    // 3. Call the API with a type assertion, as we've already validated the required fields.
    await createFood(payload as CreateFoodPayload)
    // 성공 시 음식 목록 페이지로 이동 (history stack에 쌓이지 않도록 replace 사용)
    router.replace('/food-db')
  } catch (err) {
    error.value = '음식 등록에 실패했습니다. 다시 시도해주세요.'
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
    <!-- 모바일 프레임 -->
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">새로운 음식 등록</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Form Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <form @submit.prevent="handleSubmit" class="space-y-4">
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
              :disabled="isSubmitting"
              class="w-full h-12 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400"
            >
              <span v-if="isSubmitting">저장 중...</span>
              <span v-else>저장하기</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>
