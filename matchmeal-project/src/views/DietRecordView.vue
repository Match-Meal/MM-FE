<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDietStore, type DietFoodItem } from '@/stores/dietStore'
import {
  createDiet,
  getDietDetail,
  updateDiet,
  deleteDiet,
  type DietDetailItem,
  analyzeDietImage,
  type FoodAnalysisResponseDto,
  type MatchedFoodItem,
} from '@/services/dietService'
import { createFood, type CreateFoodPayload } from '@/services/foodService'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge'
import { useToastStore } from '@/stores/toast'
import { useConfirmStore } from '@/stores/confirm'
import { 
  ArrowLeft, 
  Camera, 
  Search, 
  PenLine, 
  X, 
  Check, 
  Trash2, 
  Sparkles, 
  Scan,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  Utensils
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const dietStore = useDietStore()
const challengeStore = useChallengeStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const { currentDiet } = storeToRefs(dietStore)

const isEditMode = computed(() => !!route.params.id)
const isLoading = ref(false)

// AI Analysis State
const isAnalyzing = ref(false)
const showAnalysisModal = ref(false)
const analysisResult = ref<FoodAnalysisResponseDto | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

// 이미지 압축 함수
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX_WIDTH = 1280
        const MAX_HEIGHT = 1280

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Image compression failed'))
            }
          },
          'image/jpeg',
          0.7,
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      try {
        const compressedFile = await compressImage(file)
        currentDiet.value.imageFile = compressedFile

        if (
          currentDiet.value.previewImageUrl &&
          currentDiet.value.previewImageUrl.startsWith('blob:')
        ) {
          URL.revokeObjectURL(currentDiet.value.previewImageUrl)
        }
        currentDiet.value.previewImageUrl = URL.createObjectURL(compressedFile)

        isAnalyzing.value = true
        showAnalysisModal.value = true

        try {
          const result = await analyzeDietImage(compressedFile)

          if (!isAnalyzing.value) return

          analysisResult.value = result
        } catch (e) {
          console.error('AI Analysis failed:', e)
          if (isAnalyzing.value) {
            toastStore.show('음식 분석에 실패했습니다. 직접 입력해주세요.')
            showAnalysisModal.value = false
          }
        } finally {
          isAnalyzing.value = false
        }
      } catch (e) {
        console.error('Image compression failed:', e)
        toastStore.show('이미지 처리에 실패했습니다. 원본을 사용합니다.', 'error')

        currentDiet.value.imageFile = file
        if (
          currentDiet.value.previewImageUrl &&
          currentDiet.value.previewImageUrl.startsWith('blob:')
        ) {
          URL.revokeObjectURL(currentDiet.value.previewImageUrl)
        }
        currentDiet.value.previewImageUrl = URL.createObjectURL(file)
      }
    }
  }
}

const initData = async () => {
  if (isEditMode.value) {
    if (currentDiet.value.dietId !== Number(route.params.id)) {
      try {
        isLoading.value = true
        const data = await getDietDetail(Number(route.params.id))
        const detail = data.data || data

        currentDiet.value = {
          dietId: detail.dietId,
          eatDate: detail.eatDate,
          eatTime: detail.eatTime.substring(0, 5),
          mealType: detail.mealType,
          memo: detail.memo,
          foods: detail.details.map((d: DietDetailItem) => ({
            foodId: d.foodId ?? undefined,
            foodName: d.foodName,
            quantity: d.quantity,
            unit: d.unit,
            calories: d.calories,
            carbohydrate: d.carbohydrate,
            protein: d.protein,
            fat: d.fat,
            sugars: d.sugars,
            sodium: d.sodium,
          })),
        }

        if (detail.dietImgUrl) {
          currentDiet.value.previewImageUrl = detail.dietImgUrl
        }
      } catch (e) {
        console.error(e)
        toastStore.show('식단 정보를 불러오지 못했습니다.', 'error')
        router.back()
      } finally {
        isLoading.value = false
      }
    }
  } else {
    if (!currentDiet.value.eatDate) {
      dietStore.resetCurrentDiet()
    }
  }
}

onMounted(() => {
  initData()
})

const goBack = () => {
  router.back()
}

const goFoodSearch = () => {
  router.push('/food-db?mode=select')
}

const removeFood = (index: number) => {
  dietStore.removeFoodFromDiet(index)
}

const saveDiet = async () => {
  if (currentDiet.value.foods.length === 0 && !currentDiet.value.memo) {
    toastStore.show('음식을 추가하거나 메모를 입력해주세요.')
    return
  }

  const payload = {
    ...currentDiet.value,
    eatTime:
      currentDiet.value.eatTime.length === 5
        ? `${currentDiet.value.eatTime}:00`
        : currentDiet.value.eatTime,
  }

  try {
    if (isEditMode.value && currentDiet.value.dietId) {
      await updateDiet(currentDiet.value.dietId, payload, currentDiet.value.imageFile || undefined)
      toastStore.show('수정되었습니다.')
    } else {
      await createDiet(payload, currentDiet.value.imageFile || undefined)
      toastStore.show('저장되었습니다.')
    }
    await challengeStore.fetchMyChallenges()
    await challengeStore.updateAllMyChallengesProgress()

    router.replace('/diet')
  } catch (e) {
    console.error(e)
    toastStore.show('저장에 실패했습니다.')
  }
}

const handleDeleteClick = async () => {
  const isConfirmed = await confirmStore.show('정말 삭제하시겠습니까?', '식단 삭제', '삭제', '취소')
  if (isConfirmed && currentDiet.value.dietId) {
    try {
      await deleteDiet(currentDiet.value.dietId)
      await challengeStore.fetchMyChallenges()
      await challengeStore.updateAllMyChallengesProgress()
      toastStore.show('삭제되었습니다.')
      router.replace('/diet')
    } catch (e) {
      console.error(e)
      toastStore.show('삭제에 실패했습니다.')
    }
  }
}

const totalCalories = computed(() => {
  return currentDiet.value.foods.reduce((acc: number, cur: DietFoodItem) => acc + cur.calories, 0)
})

const updateQuantity = (index: number, newQty: number) => {
  const food = currentDiet.value.foods[index]
  if (!food || newQty <= 0) return

  const ratio = newQty / food.quantity
  food.quantity = newQty
  food.calories *= ratio
  food.carbohydrate *= ratio
  food.protein *= ratio
  food.fat *= ratio
  if (food.sugars !== undefined) food.sugars *= ratio
  if (food.sodium !== undefined) food.sodium *= ratio
}

// --- 직접 입력 모달 관련 ---
const showManualInput = ref(false)
const manualFood = ref({
  foodName: '',
  calories: undefined as number | undefined,
  carbohydrate: undefined as number | undefined,
  protein: undefined as number | undefined,
  fat: undefined as number | undefined,
  sugars: undefined as number | undefined,
  sodium: undefined as number | undefined,
  quantity: 1,
  unit: 'g',
  saveToDictionary: false,
})

const openManualInput = () => {
  manualFood.value = {
    foodName: '',
    calories: undefined,
    carbohydrate: undefined,
    protein: undefined,
    fat: undefined,
    sugars: undefined,
    sodium: undefined,
    quantity: 1,
    unit: 'g',
    saveToDictionary: false,
  }
  showManualInput.value = true
}

const closeManualInput = () => {
  showManualInput.value = false
}

const addManualFood = async () => {
  if (!manualFood.value.foodName) {
    toastStore.show('음식 이름을 입력해주세요.')
    return
  }

  const calories = manualFood.value.calories || 0
  const carbs = manualFood.value.carbohydrate || 0
  const protein = manualFood.value.protein || 0
  const fat = manualFood.value.fat || 0
  const sugars = manualFood.value.sugars
  const sodium = manualFood.value.sodium

  let foodId: number | undefined = undefined

  if (manualFood.value.saveToDictionary) {
    try {
      const payload: CreateFoodPayload = {
        foodName: manualFood.value.foodName,
        category: '기타',
        servingSize: manualFood.value.quantity,
        unit: manualFood.value.unit,
        calories: calories,
        carbohydrate: carbs,
        protein: protein,
        fat: fat,
        sugars: sugars,
        sodium: sodium,
      }
      foodId = await createFood(payload)
    } catch (e) {
      console.error('음식 사전 저장 실패:', e)
      if (
        !(await confirmStore.show('음식 사전에 저장하지 못했습니다.\n식단에는 추가하시겠습니까?'))
      ) {
        return
      }
    }
  }

  dietStore.addFoodToDiet({
    foodId: foodId,
    foodName: manualFood.value.foodName,
    quantity: manualFood.value.quantity,
    unit: manualFood.value.unit,
    calories: calories,
    carbohydrate: carbs,
    protein: protein,
    fat: fat,
    sugars: sugars,
    sodium: sodium,
  })

  closeManualInput()
}

const selectAnalyzedFood = (food: MatchedFoodItem) => {
  dietStore.addFoodToDiet({
    foodId: food.foodId,
    foodName: food.foodName,
    quantity: food.servingSize || 1,
    unit: food.unit || 'g',
    calories: food.calories,
    carbohydrate: food.carbohydrate,
    protein: food.protein,
    fat: food.fat,
    sugars: food.sugars,
    sodium: food.sodium,
  })
  showAnalysisModal.value = false
  toastStore.show('음식이 추가되었습니다.')
}

const cancelAnalysis = () => {
  isAnalyzing.value = false
  showAnalysisModal.value = false
}
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">{{ isEditMode ? '식단 수정' : '식단 기록' }}</h1>
        <div class="w-8"></div>
      </header>
    
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-white pb-20 p-6 space-y-6 no-scrollbar">
        <div v-if="isLoading" class="flex items-center justify-center py-10">
            <Loader2 class="animate-spin text-primary-500" :size="32" />
        </div>
        <template v-else>
          <!-- Image Upload / Analysis Placeholder -->
          <div class="flex justify-center">
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />
            <div
              class="w-full h-64 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 gap-2 relative overflow-hidden cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors group"
              @click="triggerFileInput"
            >
              <img
                v-if="currentDiet.previewImageUrl"
                :src="currentDiet.previewImageUrl"
                class="absolute inset-0 w-full h-full object-cover"
              />

              <template v-else>
                <div class="p-4 bg-white rounded-full shadow-sm mb-1 group-hover:scale-110 transition-transform">
                    <Camera :size="28" />
                </div>
                <span class="text-xs font-bold">사진을 등록하면 AI가 분석해요</span>
              </template>

              <div
                v-if="currentDiet.previewImageUrl"
                class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition backdrop-blur-[1px]"
              >
                <span class="text-white font-bold bg-white/20 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                  ><Camera :size="16" /> 사진 변경</span
                >
              </div>
            </div>
          </div>

          <!-- Date & Time & MealType -->
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Calendar :size="12" /> 날짜</label>
              <input type="date" v-model="currentDiet.eatDate" class="input-field text-sm font-medium" />
            </div>
            <div class="flex-1">
              <label class="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Clock :size="12" /> 시간</label>
              <input type="time" v-model="currentDiet.eatTime" class="input-field text-sm font-medium" />
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Utensils :size="12" /> 식사 구분</label>
            <div class="relative">
                <select v-model="currentDiet.mealType" class="input-field text-sm font-medium bg-white appearance-none">
                  <option value="BREAKFAST">아침</option>
                  <option value="LUNCH">점심</option>
                  <option value="DINNER">저녁</option>
                  <option value="SNACK">간식</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown :size="16" />
                </div>
            </div>
          </div>

          <!-- Food List -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold text-slate-500 block">메뉴 목록</label>
              <div class="flex gap-2">
                  <button
                    @click="goFoodSearch"
                    class="text-xs text-primary-600 font-bold px-2 py-1 hover:bg-primary-50 rounded flex items-center gap-1 transition"
                  >
                    <Search :size="12" /> 메뉴 검색
                  </button>
                  <button
                    @click="openManualInput"
                    class="text-xs text-slate-500 font-bold px-2 py-1 hover:bg-slate-100 rounded border border-slate-200 flex items-center gap-1 transition"
                  >
                    <PenLine :size="12" /> 직접 입력
                  </button>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="(food, index) in currentDiet.foods"
                :key="index"
                class="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm animate-fade-in-up relative group hover:border-primary-100 transition-colors"
              >
                <!-- Line 1: Name and Delete -->
                <div class="flex justify-between items-start mb-2">
                  <div class="flex-1 mr-2">
                    <input
                      type="text"
                      v-model="food.foodName"
                      class="w-full font-bold text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
                      placeholder="음식명"
                    />
                  </div>
                  <button @click="removeFood(index)" class="text-slate-300 hover:text-rose-500 p-1 transition-colors">
                    <X :size="16" />
                  </button>
                </div>

                <!-- Line 2: Quantity and Calories -->
                <div class="flex items-center gap-4" v-if="food">
                    <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                        <input
                          type="number"
                          v-model.number="food.quantity"
                          @change="updateQuantity(index, food.quantity)"
                          class="w-12 text-right bg-transparent text-sm font-bold focus:outline-none"
                        />
                        <span class="text-xs text-slate-400 font-medium">{{ food.unit }}</span>
                    </div>

                  <div class="flex-1 text-right flex flex-col justify-center">
                    <span class="text-sm font-bold text-slate-800"
                      >{{ Math.round(food.calories || 0) }} <span class="text-xs font-normal text-slate-400">kcal</span></span
                    >
                    <div class="text-[10px] text-slate-400 mt-1">
                      탄{{ Math.round(food.carbohydrate || 0) }} / 단{{
                        Math.round(food.protein || 0)
                      }} / 지{{ Math.round(food.fat || 0) }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="currentDiet.foods.length === 0"
                class="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 gap-2"
              >
                <div class="p-2 bg-white rounded-full shadow-sm">
                    <Utensils :size="20" class="text-slate-300" />
                </div>
                <span class="text-xs font-medium">추가된 음식이 없습니다.</span>
              </div>
            </div>
          </div>

          <!-- Memo -->
          <div>
            <label class="text-xs font-bold text-slate-500 mb-1.5 block">메모</label>
            <textarea
              v-model="currentDiet.memo"
              class="input-field h-24 py-3 resize-none bg-slate-50"
              placeholder="오늘 식사는 어땠나요?"
            ></textarea>
          </div>

          <!-- Display Total -->
          <div class="bg-primary-50 p-5 rounded-2xl flex justify-between items-center shadow-inner">
            <span class="text-sm font-bold text-primary-800">총 섭취 칼로리</span>
            <span class="text-xl font-bold text-primary-600"
              >{{ Math.round(totalCalories) }} <span class="text-sm font-normal text-primary-400">kcal</span></span
            >
          </div>
        </template>
      </main>

      <!-- Footer Actions -->
      <div class="p-4 border-t border-slate-100 bg-white flex gap-3 z-10">
        <button
          v-if="isEditMode"
          @click="handleDeleteClick"
          class="flex-1 h-12 border border-rose-100 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
        >
          <Trash2 :size="18" /> 삭제
        </button>
        <button
          @click="saveDiet"
          class="flex-[2] h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-2xl hover:brightness-110 shadow-lg shadow-primary-200 transition active:scale-[0.98]"
        >
          저장하기
        </button>
      </div>


    <!-- 직접 입력 모달 -->
    <div
      v-if="showManualInput"
      class="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
    >
      <div class="bg-white rounded-3xl w-full max-w-sm max-h-[80%] overflow-y-auto no-scrollbar p-6 shadow-float animate-scale-up">
        <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
            <PenLine :size="20" class="text-primary-500" /> 음식 직접 입력
        </h3>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-500 mb-1 block"
              >음식 이름 <span class="text-rose-500">*</span></label
            >
            <input
              type="text"
              v-model="manualFood.foodName"
              class="input-field h-11"
              placeholder="예: 엄마표 김치찌개"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">섭취량</label>
              <input type="number" v-model.number="manualFood.quantity" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">단위</label>
              <div class="relative">
                  <select v-model="manualFood.unit" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm bg-white appearance-none">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                   <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown :size="16" />
                    </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">칼로리 (kcal)</label>
              <input type="number" v-model.number="manualFood.calories" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">탄수화물 (g)</label>
              <input
                type="number"
                v-model.number="manualFood.carbohydrate"
                class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">단백질 (g)</label>
              <input type="number" v-model.number="manualFood.protein" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">지방 (g)</label>
              <input type="number" v-model.number="manualFood.fat" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-1">
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">당류 (g)</label>
              <input type="number" v-model.number="manualFood.sugars" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1 block">나트륨 (mg)</label>
              <input type="number" v-model.number="manualFood.sodium" class="w-full h-11 border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800 text-sm" />
            </div>
          </div>

          <div
            class="flex items-center gap-2 pt-3 cursor-pointer group"
            @click="manualFood.saveToDictionary = !manualFood.saveToDictionary"
          >
            <div
              class="w-5 h-5 border-2 rounded flex items-center justify-center transition"
              :class="
                manualFood.saveToDictionary ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'
              "
            >
              <Check v-if="manualFood.saveToDictionary" class="text-white" :size="14" stroke-width="3" />
            </div>
            <span class="text-sm font-bold text-slate-700">음식 사전에 저장하기</span>
          </div>
          <p class="text-[10px] text-slate-400 pl-7 -mt-3">
            체크 시 다른 사람들도 이 음식을 검색할 수 있어요.
          </p>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="closeManualInput"
            class="flex-1 h-12 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            취소
          </button>
          <button
            @click="addManualFood"
            class="flex-1 h-12 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition"
          >
            추가하기
          </button>
        </div>
      </div>
    </div>

    <!-- AI Analysis Unified Modal -->
    <div
      v-if="showAnalysisModal"
      class="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
    >
      <!-- Scanning State -->
      <div v-if="isAnalyzing" class="flex flex-col items-center justify-center w-full max-w-sm">
        <div
          class="relative w-64 h-64 rounded-3xl overflow-hidden border-4 border-primary-500 shadow-2xl shadow-primary-500/40 mb-8"
        >
          <!-- Background Image -->
          <img
            v-if="currentDiet.previewImageUrl"
            :src="currentDiet.previewImageUrl"
            class="absolute inset-0 w-full h-full object-cover opacity-60"
          />

          <!-- Scanning Line -->
          <div
            class="absolute inset-0 bg-gradient-to-b from-transparent via-primary-400/30 to-transparent w-full h-full animate-scan"
          ></div>
          <div
            class="absolute top-0 left-0 w-full h-1 bg-primary-400 shadow-[0_0_15px_rgba(59,130,246,1)] animate-scan-line"
          ></div>

          <!-- Grid Overlay -->
          <div
            class="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.2)_1px,transparent_1px)] bg-[size:20px_20px]"
          ></div>
          
           <div class="absolute inset-0 flex items-center justify-center">
            <Scan class="text-white/80 animate-pulse" :size="48" />
           </div>
        </div>

        <div class="text-center space-y-2 relative z-10">
          <h3 class="text-2xl font-bold text-white animate-pulse flex items-center justify-center gap-2">
            <Sparkles :size="24" class="text-yellow-300" /> AI 음식 분석중...
          </h3>
          <p class="text-primary-100 text-sm">이미지에서 영양 정보를 추출하고 있습니다</p>
          <button
            @click="cancelAnalysis"
            class="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm backdrop-blur-md transition border border-white/20 font-medium"
          >
            분석 취소
          </button>
        </div>
      </div>

      <!-- Result State -->
      <div
        v-else-if="analysisResult"
        class="bg-white rounded-3xl w-full max-w-sm max-h-[80%] flex flex-col shadow-float animate-scale-up overflow-hidden"
      >
        <div class="p-5 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
          <h3 class="font-bold text-lg flex items-center gap-2 text-slate-800">
            <Sparkles :size="20" class="text-primary-500" /> AI 분석 결과
          </h3>
          <button @click="showAnalysisModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition">
            <X :size="24" />
          </button>
        </div>

        <div class="p-5 overflow-y-auto no-scrollbar">
          <div class="mb-6 text-center">
            <div
              class="w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-slate-200 shadow-inner"
            >
              <img
                v-if="currentDiet.previewImageUrl"
                :src="currentDiet.previewImageUrl"
                class="w-full h-full object-cover"
              />
            </div>
            <p class="text-sm text-slate-500 mb-1 font-medium">AI가 예측한 음식</p>
            <p class="text-2xl font-bold text-primary-600 mb-2">{{ analysisResult.predictedName }}</p>
            <div class="px-3 py-1 bg-slate-50 rounded-lg inline-block">
                <p class="text-xs text-slate-400">
                후보: {{ analysisResult.candidates.join(', ') }}
                </p>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Check :size="16" class="text-primary-500" /> 검색된 영양 정보 선택
            </p>
            <div
              v-for="food in analysisResult.matchedFoods"
              :key="food.foodId"
              @click="selectAnalyzedFood(food)"
              class="border border-slate-200 rounded-2xl p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition relative group shadow-sm bg-white"
            >
              <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-slate-800">{{ food.foodName }}</span>
                <span
                  class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-primary-200 group-hover:text-primary-700 transition"
                  >선택</span
                >
              </div>
              <div class="text-xs text-slate-500">
                <span class="font-bold text-slate-700">{{ food.servingSize }}{{ food.unit }}</span>
                / {{ Math.round(food.calories) }} kcal
              </div>
              <div class="text-[10px] text-slate-400 mt-1.5 flex gap-2">
                <span>탄 {{ Math.round(food.carbohydrate) }}</span>
                <span class="w-[1px] h-3 bg-slate-200"></span>
                <span>단 {{ Math.round(food.protein) }}</span>
                <span class="w-[1px] h-3 bg-slate-200"></span>
                <span>지 {{ Math.round(food.fat) }}</span>
              </div>
            </div>
          </div>

          <div class="mt-8 text-center border-t border-slate-100 pt-5">
            <button
              @click="showAnalysisModal = false"
              class="text-xs text-slate-400 underline hover:text-slate-800 transition"
            >
              원하는 음식이 없나요? 직접 입력하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full border border-slate-300 rounded-xl px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-300 text-slate-800;
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-fade-in {
  animation: fadein 0.2s ease-out;
}
@keyframes fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}
.animate-scan {
  animation: scan 2s linear infinite;
}

@keyframes scanLine {
  0% {
    top: 0%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}
.animate-scan-line {
  animation: scanLine 2s linear infinite;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
