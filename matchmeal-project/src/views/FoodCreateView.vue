<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createFood, type CreateFoodPayload, getFoodCategories } from '@/services/foodService'
import { useToastStore } from '@/stores/toast'
import { 
  ArrowLeft, 
  ChevronDown, 
  Loader2 
} from 'lucide-vue-next'

const router = useRouter()
const toastStore = useToastStore()

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
  sugars: undefined,
  sodium: undefined
})

// --- 카테고리 드롭다운 상태 ---
const categories = ref<string[]>([])
const categorySearch = ref('') // 사용자가 입력하는 검색어 또는 선택된 카테고리
const isCategoryDropdownOpen = ref(false)
const categoryWrapper = ref<HTMLElement | null>(null)

// 사용자가 카테고리 입력창에 직접 타이핑하는 경우, 해당 값을 foodData에 반영
watch(categorySearch, (newValue) => {
  if (foodData.value.category !== newValue) {
    foodData.value.category = newValue
  }
})

// 컴포넌트 마운트 시 카테고리 목록 불러오기
onMounted(async () => {
  try {
    categories.value = await getFoodCategories()
  } catch (err) {
    console.error('카테고리 목록을 불러오는 데 실패했습니다.', err)
  }
})

// 입력된 검색어에 따라 카테고리 목록 필터링
const filteredCategories = computed(() => {
  if (!categorySearch.value) {
    return categories.value
  }
  return categories.value.filter((c) => c.toLowerCase().includes(categorySearch.value.toLowerCase()))
})

// 드롭다운에서 카테고리 선택 시
const selectCategory = (category: string) => {
  foodData.value.category = category
  categorySearch.value = category // 입력창에도 선택된 값 표시
  isCategoryDropdownOpen.value = false
}

// 드롭다운 외부 클릭 시 드롭다운 닫기
const handleCategoryBlur = (event: FocusEvent) => {
  if (categoryWrapper.value && !categoryWrapper.value.contains(event.relatedTarget as Node)) {
    isCategoryDropdownOpen.value = false
  }
}

const error = ref<string | null>(null)
const isSubmitting = ref(false)

// 폼 제출 핸들러
const handleSubmit = async () => {
  if (!foodData.value.foodName) {
    error.value = '음식 이름은 필수입니다.'
    return
  }

  // 카테고리 유효성 검사
  if (foodData.value.category && !categories.value.includes(foodData.value.category)) {
    error.value = '선택할 수 없는 카테고리입니다. 목록에 있는 카테고리를 선택해주세요.'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const payload: Partial<CreateFoodPayload> = { ...foodData.value }

    const numericKeys: (keyof CreateFoodPayload)[] = [
      'servingSize',
      'calories',
      'carbohydrate',
      'protein',
      'fat',
      'sugars',
      'sodium',
    ]
    numericKeys.forEach((key) => {
      if (payload[key] === '') {
        payload[key] = undefined
      }
    })

    await createFood(payload as CreateFoodPayload)
    toastStore.show('음식이 등록되었습니다.')
    router.back()
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
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">새로운 음식 등록</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Form Content -->
      <main class="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="foodName" class="block text-xs font-bold text-slate-500 mb-1.5"
              >음식 이름 <span class="text-rose-500">*</span></label
            >
            <input
              v-model="foodData.foodName"
              type="text"
              id="foodName"
              placeholder="예: 닭가슴살 볶음밥"
              class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
              required
            />
          </div>

          <div class="relative" ref="categoryWrapper" @focusout="handleCategoryBlur">
            <label for="category" class="block text-xs font-bold text-slate-500 mb-1.5"
              >카테고리</label
            >
            <div class="relative">
                <input
                v-model="categorySearch"
                type="text"
                id="category"
                placeholder="카테고리 검색 또는 선택"
                autocomplete="off"
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
                @focus="isCategoryDropdownOpen = true"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown :size="16" />
                </div>
            </div>
            
            <transition name="fade">
                <div
                v-if="isCategoryDropdownOpen"
                class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto no-scrollbar"
                >
                <div
                    v-for="cat in filteredCategories"
                    :key="cat"
                    @mousedown="selectCategory(cat)"
                    class="px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer border-b border-slate-50 last:border-0"
                >
                    {{ cat }}
                </div>
                <div v-if="filteredCategories.length === 0" class="px-4 py-3 text-sm text-slate-400 text-center">
                    일치하는 카테고리가 없습니다.
                </div>
                </div>
            </transition>
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
              />
            </div>
            <div>
              <label for="unit" class="block text-xs font-bold text-slate-500 mb-1.5">단위</label>
              <input
                v-model="foodData.unit"
                type="text"
                id="unit"
                placeholder="g, ml, 개 등"
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
              />
            </div>
            <div>
              <label for="fat" class="block text-xs font-bold text-slate-500 mb-1.5">지방 (g)</label>
              <input
                v-model.number="foodData.fat"
                type="number"
                step="0.1"
                id="fat"
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
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
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
              />
            </div>
          </div>

          <div v-if="error" class="bg-rose-50 text-rose-500 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bg-rose-200 flex items-center justify-center text-[10px] font-bold">!</div>
            {{ error }}
          </div>

          <div class="pt-6">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-2xl hover:brightness-110 transition flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-primary-200"
            >
              <Loader2 v-if="isSubmitting" class="animate-spin mr-2" :size="20" />
              <span v-else>저장하기</span>
            </button>
          </div>
        </form>
      </main>
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
