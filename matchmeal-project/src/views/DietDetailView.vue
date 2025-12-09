<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDietDetail, deleteDiet, type DailyDietResponseItem } from '@/services/dietService'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const dietId = Number(route.params.id)
const dietData = ref<DailyDietResponseItem | null>(null)
const isLoading = ref(false)

const initData = async () => {
  try {
    isLoading.value = true
    const response = await getDietDetail(dietId)
    // response 구조가 {code, message, data: {...}} 라면 response.data가 실제 데이터
    // dietService.ts에서 response.data를 리턴했으므로, 여기서 response.data가 실제 데이터 객체일 수 있음.
    // 하지만 service 코드에서 response.data를 리턴했는지, response.data.data인지 확실치 않을 땐,
    // 보통 { data: ... } 구조를 가정.
    // 일단 안전하게:
    // 만약 response.data 가 존재하면 그것을 사용.
    if (response.data) {
        dietData.value = response.data
    } else {
        // 혹시 response 자체가 데이터라면? (드물지만)
        dietData.value = response as unknown as DailyDietResponseItem
    }
  } catch (e) {
    console.error(e)
    alert('식단 상세 정보를 불러오지 못했습니다.')
    router.back()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (dietId) {
    initData()
  } else {
    alert('잘못된 접근입니다.')
    router.back()
  }
})

const goBack = () => router.back()

const goEdit = () => {
  router.push(`/diet/record/${dietId}`)
}

const deleteItem = async () => {
  if (!confirm('정말로 삭제하시겠습니까?')) return
  try {
    await deleteDiet(dietId)
    alert('삭제되었습니다.')
    router.replace('/diet')
  } catch (e) {
    console.error(e)
    alert('삭제에 실패했습니다.')
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
        'BREAKFAST': '아침',
        'LUNCH': '점심',
        'DINNER': '저녁',
        'SNACK': '간식'
    }
    return types[type] || type
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="goBack" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">식단 상세</h1>
        <div class="w-8"></div>
      </header>

      <main v-if="isLoading" class="flex-1 flex items-center justify-center">
        Loading...
      </main>

      <main v-else-if="dietData" class="flex-1 overflow-y-auto bg-gray-50 pb-20">
        <!-- Date / Time / Type Info -->
        <div class="bg-white p-6 mb-2 rounded-b-2xl shadow-sm">
            <div class="flex justify-between items-end mb-4">
                <div>
                    <div class="text-2xl font-bold">{{ formatDate(dietData.eatDate) }}</div>
                    <div class="text-gray-500 font-medium mt-1">
                        <span class="text-blue-600 font-bold mr-2">{{ mealLabel(dietData.mealType) }}</span>
                        {{ formatTime(dietData.eatTime) }}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-3xl font-bold text-gray-800">{{ totalCalories }} <span class="text-sm font-normal text-gray-500">kcal</span></div>
                </div>
            </div>

            <!-- Total Macros -->
            <div class="flex bg-gray-50 rounded-xl p-3 justify-around text-center">
                <div>
                    <div class="text-xs text-gray-400 mb-1">탄수화물</div>
                    <div class="font-bold">{{ Math.round(dietData.totalCarbohydrate || 0) }}g</div>
                </div>
                <div class="w-px bg-gray-200"></div>
                <div>
                    <div class="text-xs text-gray-400 mb-1">단백질</div>
                    <div class="font-bold">{{ Math.round(dietData.totalProtein || 0) }}g</div>
                </div>
                <div class="w-px bg-gray-200"></div>
                <div>
                    <div class="text-xs text-gray-400 mb-1">지방</div>
                    <div class="font-bold">{{ Math.round(dietData.totalFat || 0) }}g</div>
                </div>
            </div>
        </div>

        <!-- Food List -->
        <div class="bg-white p-6 mb-2 shadow-sm" v-if="dietData.details && dietData.details.length > 0">
            <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🍽️</span> 섭취 메뉴
            </h3>
            <div class="space-y-4">
                <div v-for="food in dietData.details" :key="food.dietDetailId" class="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                        <div class="font-bold text-sm">{{ food.foodName }}</div>
                        <div class="text-xs text-gray-400 mt-0.5">
                            {{ food.quantity }}{{ food.unit }}
                        </div>
                    </div>
                    <div class="text-sm font-bold text-gray-600">
                        {{ Math.round(food.calories) }} kcal
                    </div>
                </div>
            </div>
        </div>

        <!-- Memo -->
        <div class="bg-white p-6 shadow-sm" v-if="dietData.memo">
            <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📝</span> 메모
            </h3>
            <p class="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{{ dietData.memo }}</p>
        </div>

      </main>

      <!-- Footer Buttons -->
      <div v-if="!isLoading && dietData" class="p-4 border-t bg-white flex gap-3 z-10">
        <button 
           @click="deleteItem" 
           class="flex-1 h-12 border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
        >
            삭제
        </button>
        <button 
           @click="goEdit" 
           class="flex-[2] h-12 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition"
        >
            수정하기
        </button>
      </div>

    </div>
  </div>
</template>
