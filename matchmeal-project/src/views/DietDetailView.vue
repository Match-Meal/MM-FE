<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDietDetail, deleteDiet, type DailyDietResponseItem } from '@/services/dietService'
import dayjs from 'dayjs'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToastStore } from '@/stores/toast'
import { 
  ArrowLeft, 
  Trash2, 
  Edit2, 
  Utensils, 
  Clock, 
  FileText,
  Calendar,
  Flame
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const dietId = Number(route.params.id)
const dietData = ref<DailyDietResponseItem | null>(null)
const isLoading = ref(false)
const isDeleteModalOpen = ref(false)

const initData = async () => {
  try {
    isLoading.value = true
    const response = await getDietDetail(dietId)
    if (response.data) {
      dietData.value = response.data
    } else {
      dietData.value = response as unknown as DailyDietResponseItem
    }
  } catch (e) {
    console.error(e)
    toastStore.show('식단 상세 정보를 불러오지 못했습니다.', 'error')
    router.back()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (dietId) {
    initData()
  } else {
    toastStore.show('잘못된 접근입니다.', 'error')
    router.back()
  }
})

const goBack = () => router.back()

const goEdit = () => {
  router.push(`/diet/record/${dietId}`)
}

const handleDeleteClick = () => {
  isDeleteModalOpen.value = true
}

const handleConfirmDelete = async () => {
  try {
    await deleteDiet(dietId)
    toastStore.show('식단이 삭제되었습니다.')
    router.replace('/diet')
  } catch (e) {
    console.error(e)
    toastStore.show('삭제에 실패했습니다.', 'error')
  } finally {
    isDeleteModalOpen.value = false
  }
}

const formatTime = (time: string) => {
  // HH:mm:ss -> HH:mm
  return time ? time.substring(0, 5) : ''
}

const formatDate = (date: string) => dayjs(date).format('M월 D일 (ddd)')

const totalCalories = computed(() => {
  return dietData.value?.totalCalories ? Math.round(dietData.value.totalCalories) : 0
})

const mealLabel = (type: string) => {
  const types: Record<string, string> = {
    BREAKFAST: '아침',
    LUNCH: '점심',
    DINNER: '저녁',
    SNACK: '간식',
  }
  return types[type] || type
}
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">식단 상세</h1>
        <div class="w-8"></div>
      </header>

      <main v-if="isLoading" class="flex-1 flex items-center justify-center text-slate-400">
         <div class="flex flex-col items-center gap-2">
             <div class="w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
             <span class="text-xs">불러오는 중...</span>
         </div>
      </main>

      <main v-else-if="dietData" class="flex-1 overflow-y-auto bg-slate-50 pb-20 no-scrollbar">
        <!-- Diet Image -->
        <div class="w-full h-72 bg-slate-100 relative group">
          <img 
            v-if="dietData.dietImgUrl" 
            :src="dietData.dietImgUrl" 
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 bg-slate-100">
              <Utensils :size="48" />
              <span class="text-xs font-bold">이미지 없음</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div class="text-white w-full">
                   <div class="flex justify-between items-end">
                       <div>
                            <span class="inline-block px-2.5 py-1 bg-primary-600 text-white text-[10px] font-bold rounded-full mb-2 shadow-sm">
                                {{ mealLabel(dietData.mealType) }}
                            </span>
                            <h2 class="text-3xl font-bold flex items-baseline gap-1">
                                {{ totalCalories }} <span class="text-sm font-normal opacity-80">kcal</span>
                            </h2>
                       </div>
                       <div class="text-right">
                           <div class="flex items-center gap-1.5 text-sm font-medium opacity-90 mb-0.5">
                               <Calendar :size="14" /> {{ formatDate(dietData.eatDate) }}
                           </div>
                           <div class="flex items-center gap-1.5 text-sm font-medium opacity-90 justify-end">
                               <Clock :size="14" /> {{ formatTime(dietData.eatTime) }}
                           </div>
                       </div>
                   </div>
              </div>
          </div>
        </div>

        <div class="px-5 py-6 space-y-4 -mt-6 relative z-10">
            <!-- Total Macros -->
            <div class="bg-white rounded-3xl shadow-float p-5 border border-slate-100 mt-2">
                <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <Flame :size="16" class="text-orange-500 fill-orange-500" /> 영양 성분 요약
                </h3>
                <div class="flex justify-between text-center divide-x divide-slate-100">
                    <div class="flex-1 px-2">
                        <div class="text-xs font-bold text-slate-400 mb-1">탄수화물</div>
                        <div class="font-bold text-lg text-slate-800">{{ Math.round(dietData.totalCarbohydrate || 0) }}<span class="text-xs font-normal text-slate-400 ml-0.5">g</span></div>
                    </div>
                    <div class="flex-1 px-2">
                        <div class="text-xs font-bold text-slate-400 mb-1">단백질</div>
                        <div class="font-bold text-lg text-slate-800">{{ Math.round(dietData.totalProtein || 0) }}<span class="text-xs font-normal text-slate-400 ml-0.5">g</span></div>
                    </div>
                    <div class="flex-1 px-2">
                        <div class="text-xs font-bold text-slate-400 mb-1">지방</div>
                        <div class="font-bold text-lg text-slate-800">{{ Math.round(dietData.totalFat || 0) }}<span class="text-xs font-normal text-slate-400 ml-0.5">g</span></div>
                    </div>
                </div>
                
                 <div class="mt-4 pt-4 border-t border-slate-50 flex justify-around text-center">
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 mb-1">당류</div>
                        <div class="font-bold text-sm text-slate-600">{{ dietData.totalSugars ? Math.round(dietData.totalSugars) : '-' }}g</div>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 mb-1">나트륨</div>
                        <div class="font-bold text-sm text-slate-600">{{ dietData.totalSodium ? Math.round(dietData.totalSodium) : '-' }}mg</div>
                    </div>
                </div>
            </div>

            <!-- Food List -->
            <div class="bg-white rounded-3xl shadow-sm p-5 border border-slate-100">
                <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <Utensils :size="16" class="text-primary-500" /> 섭취 메뉴
                </h3>
                <div class="space-y-3" v-if="dietData.details && dietData.details.length > 0">
                    <div
                        v-for="food in dietData.details"
                        :key="food.dietDetailId"
                        class="flex justify-between items-center bg-slate-50 p-3 rounded-2xl"
                    >
                        <div>
                            <div class="font-bold text-sm text-slate-800">{{ food.foodName }}</div>
                            <div class="text-xs text-slate-500 mt-0.5 font-medium">{{ food.quantity }}{{ food.unit }}</div>
                        </div>
                        <div class="text-sm font-bold text-slate-700">
                            {{ Math.round(food.calories) }} kcal
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-4 text-slate-400 text-xs">
                    등록된 메뉴가 없습니다.
                </div>
            </div>

            <!-- Memo -->
            <div class="bg-white rounded-3xl shadow-sm p-5 border border-slate-100" v-if="dietData.memo">
                <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <FileText :size="16" class="text-slate-400" /> 메모
                </h3>
                <p class="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {{ dietData.memo }}
                </p>
            </div>
        </div>
      </main>

      <!-- Footer Buttons -->
      <div v-if="!isLoading && dietData" class="p-4 border-t bg-white flex gap-3 z-10">
        <button
          @click="handleDeleteClick"
          class="flex-1 h-12 border border-rose-100 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
        >
          <Trash2 :size="18" /> 삭제
        </button>
        <button
          @click="goEdit"
          class="flex-[2] h-12 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:brightness-110 transition flex items-center justify-center gap-1.5"
        >
          <Edit2 :size="18" /> 수정하기
        </button>
      </div>
    </div>

  <ConfirmModal
    :is-open="isDeleteModalOpen"
    title="식단 삭제"
    message="정말로 삭제하시겠습니까?"
    confirm-text="삭제"
    @close="isDeleteModalOpen = false"
    @confirm="handleConfirmDelete"
  />
</template>

<style scoped>
/* Chrome, Safari, Edge */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Firefox */
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
