<script lang="ts" setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { DailyDietResponseItem } from '@/services/dietService'

const props = defineProps<{
  isOpen: boolean
  title: string
  dietList: DailyDietResponseItem[]
  challengeType?: 'CALORIE_LIMIT' | 'RECORD_FREQUENCY' | 'TIME_RANGE'
  targetValue?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 배경 클릭 시 닫기
const close = () => {
  emit('close')
}

// 총 칼로리 계산 (이미 API에 totalCalories가 있지만, 확인용)
// const getTotalCalories = (diet: DailyDietResponseItem) => {
//   return diet.totalCalories
// }

// 대표 음식 이름 (첫 번째 음식 + 외 N개)
const getSummaryFoodName = (diet: DailyDietResponseItem) => {
  if (!diet.details || diet.details.length === 0) return '음식 없음'
  const firstFood = diet.details[0]?.foodName || '음식 없음'
  if (diet.details.length > 1) {
    return `${firstFood} 외 ${diet.details.length - 1}개`
  }
  return firstFood
}

// 챌린지 조건 실패 여부 확인 (개별 식단이 아닌 일별 합계로 판단해야 하므로 템플릿에서 직접 비교하거나 computed 사용)
// 기존 isFail 함수는 제거하고 groupedDiets에서 처리

const groupedDiets = computed(() => {
  const groups: Record<string, { items: DailyDietResponseItem[]; dailyTotal: number }> = {}

  // 1. 날짜별 그룹핑
  props.dietList.forEach((diet) => {
    const dateKey = diet.eatDate // YYYY-MM-DD
    if (!groups[dateKey]) {
      groups[dateKey] = { items: [], dailyTotal: 0 }
    }
    groups[dateKey].items.push(diet)
    groups[dateKey].dailyTotal += diet.totalCalories
  })

  // 2. 날짜 내림차순 정렬 (선택사항, 보통 최신순이 좋으므로)
  const sortedKeys = Object.keys(groups).sort((a, b) => dayjs(b).diff(dayjs(a)))

  const sortedGroups: typeof groups = {}
  sortedKeys.forEach((key) => {
    const group = groups[key]
    if (group) {
      sortedGroups[key] = group
    }
  })

  return sortedGroups
})
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- 어두운 배경 -->
    <div
      class="absolute inset-0 bg-black/60 transition-opacity animate-fade-in"
      @click="close"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div
      class="relative w-full bg-white rounded-t-3xl shadow-2xl h-[70%] flex flex-col animate-slide-up overflow-hidden z-10"
    >
      <!-- 핸들바 -->
      <div class="w-full flex justify-center pt-3 pb-2" @click="close">
        <div class="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
      </div>

      <!-- 헤더 -->
      <div class="px-6 pb-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-gray-800">{{ title }}</h3>
        <span class="text-sm text-gray-500 font-medium">{{ dietList.length }}개 기록</span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gray-50/50">
        <!-- 빈 목록 -->
        <div
          v-if="dietList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-gray-400"
        >
          <span class="text-4xl mb-2">🍽️</span>
          <p class="text-sm">기록된 식단이 없습니다.</p>
        </div>

        <!-- 일별 그룹핑 리스트 -->
        <div v-for="(group, date) in groupedDiets" :key="String(date)" class="space-y-2">
          <!-- 날짜 헤더 -->
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-gray-800">{{
                dayjs(String(date)).format('YYYY.MM.DD (ddd)')
              }}</span>
              <!-- 일일 성공/실패 뱃지 (칼로리 챌린지일 경우) -->
              <span
                v-if="challengeType === 'CALORIE_LIMIT' && group.dailyTotal > (targetValue || 0)"
                class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold"
              >
                기준 초과 ({{ group.dailyTotal }} / {{ targetValue }})
              </span>
              <span
                v-else-if="challengeType === 'CALORIE_LIMIT'"
                class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold"
              >
                성공 ({{ group.dailyTotal }} / {{ targetValue }})
              </span>
            </div>
          </div>

          <!-- 해당 날짜의 식단 리스트 -->
          <div
            v-for="diet in group.items"
            :key="diet.dietId"
            class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md"
          >
            <!-- 날짜 & 끼니 정보 -->
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded"
                  :class="{
                    'bg-orange-100 text-orange-600': diet.mealType === 'BREAKFAST',
                    'bg-yellow-100 text-yellow-600': diet.mealType === 'LUNCH',
                    'bg-blue-100 text-blue-600': diet.mealType === 'DINNER',
                    'bg-purple-100 text-purple-600': diet.mealType === 'SNACK',
                  }"
                >
                  {{
                    diet.mealType === 'BREAKFAST'
                      ? '아침'
                      : diet.mealType === 'LUNCH'
                        ? '점심'
                        : diet.mealType === 'DINNER'
                          ? '저녁'
                          : '간식'
                  }}
                </span>
                <span class="text-xs text-gray-400">{{ diet.eatTime }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-blue-600 text-sm">{{ diet.totalCalories }} kcal</span>
              </div>
            </div>

            <!-- 내용 -->
            <div class="flex gap-3">
              <!-- 이미지 (있으면) -->
              <div
                v-if="diet.dietImgUrl"
                class="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0"
              >
                <img :src="diet.dietImgUrl" class="w-full h-full object-cover" />
              </div>

              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <p class="font-bold text-gray-800 text-sm truncate">
                  {{ getSummaryFoodName(diet) }}
                </p>
                <p class="text-xs text-gray-500 truncate">{{ diet.memo || '메모 없음' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
