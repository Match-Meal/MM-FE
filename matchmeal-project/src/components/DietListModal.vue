<script lang="ts" setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { DailyDietResponseItem } from '@/services/dietService'
import { Utensils, Clock, CheckCircle2, AlertCircle } from 'lucide-vue-next'

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

const close = () => {
  emit('close')
}

const getSummaryFoodName = (diet: DailyDietResponseItem) => {
  if (!diet.details || diet.details.length === 0) return '음식 없음'
  const firstFood = diet.details[0]?.foodName || '음식 없음'
  if (diet.details.length > 1) {
    return `${firstFood} 외 ${diet.details.length - 1}개`
  }
  return firstFood
}

// [수정] 삭제된 식단(details가 없는 식단) 필터링
const filteredDietList = computed(() => {
  return props.dietList.filter((diet) => diet.details && diet.details.length > 0)
})

const groupedDiets = computed(() => {
  const groups: Record<
    string,
    {
      items: DailyDietResponseItem[]
      dailyTotal: number
      count: number
      isSuccess: boolean
      hasTimedMorning: boolean
    }
  > = {}

  filteredDietList.value.forEach((diet) => {
    const dateKey = diet.eatDate
    if (!groups[dateKey]) {
      groups[dateKey] = {
        items: [],
        dailyTotal: 0,
        count: 0,
        isSuccess: false,
        hasTimedMorning: false,
      }
    }

    const group = groups[dateKey]
    group.items.push(diet)
    group.dailyTotal += diet.totalCalories || 0
    group.count += 1

    // TIME_RANGE 체크
    if (
      props.challengeType === 'TIME_RANGE' &&
      diet.mealType === 'BREAKFAST' &&
      diet.eatTime
    ) {
      const hour = parseInt((diet.eatTime ?? '0:0').split(':')[0] ?? '0')
      if (hour < (props.targetValue || 0)) {
        group.hasTimedMorning = true
      }
    }
  })

  // 날짜별 성공 여부 최종 판정
  Object.values(groups).forEach((group) => {
    if (props.challengeType === 'CALORIE_LIMIT') {
      group.isSuccess = group.dailyTotal <= (props.targetValue || 0)
    } else if (props.challengeType === 'RECORD_FREQUENCY') {
      group.isSuccess = group.count >= (props.targetValue || 0)
    } else if (props.challengeType === 'TIME_RANGE') {
      group.isSuccess = group.hasTimedMorning
    }
  })

  // 날짜 내림차순 정렬
  const sortedKeys = Object.keys(groups).sort((a, b) => dayjs(b).diff(dayjs(a)))
  const sortedGroupsArray: Array<{
    date: string
    dailyTotal: number
    count: number
    isSuccess: boolean
    hasTimedMorning: boolean
    items: DailyDietResponseItem[]
  }> = []

  sortedKeys.forEach((key) => {
    const rawGroup = groups[key]
    if (rawGroup) {
      sortedGroupsArray.push({
        date: key,
        items: rawGroup.items,
        dailyTotal: rawGroup.dailyTotal,
        count: rawGroup.count,
        isSuccess: rawGroup.isSuccess,
        hasTimedMorning: rawGroup.hasTimedMorning,
      })
    }
  })

  return sortedGroupsArray
})
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- 어두운 배경 -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
      @click="close"
    ></div>

    <!-- 모달 컨텐츠 -->
    <div
      class="relative w-full max-w-md bg-white rounded-t-[35px] shadow-2xl h-[70%] flex flex-col animate-slide-up overflow-hidden z-10"
    >
      <!-- 핸들바 -->
      <div class="w-full flex justify-center pt-3 pb-2 cursor-pointer" @click="close">
        <div class="w-12 h-1.5 bg-slate-300 rounded-full"></div>
      </div>

      <!-- 헤더 -->
      <div class="px-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-slate-800">{{ title }}</h3>
        <span class="text-sm text-slate-500 font-medium">{{ filteredDietList.length }}개 기록</span>
      </div>

      <!-- 리스트 영역 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-slate-50">
        <!-- 빈 목록 -->
        <div
          v-if="filteredDietList.length === 0"
          class="flex flex-col items-center justify-center h-40 text-slate-400 gap-2"
        >
          <Utensils :size="40" stroke-width="1.5" />
          <p class="text-sm">기록된 식단이 없습니다.</p>
        </div>

        <!-- 일별 그룹핑 리스트 -->
        <div v-for="group in groupedDiets" :key="group.date" class="space-y-3">
          <!-- 날짜 헤더 -->
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-800">{{
                dayjs(group.date).format('YYYY.MM.DD (ddd)')
              }}</span>

              <!-- 뱃지 (CALORIE_LIMIT) -->
              <div v-if="challengeType === 'CALORIE_LIMIT'">
                <span
                  v-if="!group.isSuccess"
                  class="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-rose-100"
                >
                  <AlertCircle :size="10" />
                  실패 ({{ Math.round(group.dailyTotal) }} / {{ targetValue }})
                </span>
                <span
                  v-else
                  class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-emerald-100"
                >
                  <CheckCircle2 :size="10" />
                   성공 ({{ Math.round(group.dailyTotal) }} / {{ targetValue }})
                </span>
              </div>

              <!-- 뱃지 (RECORD_FREQUENCY) -->
              <div v-else-if="challengeType === 'RECORD_FREQUENCY'">
                <span
                  v-if="!group.isSuccess"
                  class="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-amber-100"
                >
                  <AlertCircle :size="10" />
                  기록 중 ({{ group.count }} / {{ targetValue }})
                </span>
                <span
                  v-else
                  class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-emerald-100"
                >
                  <CheckCircle2 :size="10" />
                   성공 ({{ group.count }} / {{ targetValue }})
                </span>
              </div>

              <!-- 뱃지 (TIME_RANGE) -->
              <div v-else-if="challengeType === 'TIME_RANGE'">
                <span
                  v-if="!group.isSuccess"
                  class="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-rose-100"
                >
                  <AlertCircle :size="10" />
                  미달성 ({{ targetValue }}시 이전 아침 없음)
                </span>
                <span
                  v-else
                  class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border border-emerald-100"
                >
                  <CheckCircle2 :size="10" />
                   성공 (아침 완료)
                </span>
              </div>
            </div>
          </div>

          <!-- 해당 날짜의 식단 리스트 -->
          <div
            v-for="diet in group.items"
            :key="diet.dietId"
            class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition active:scale-[0.99]"
          >
            <!-- 날짜 & 끼니 정보 -->
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  :class="{
                    'bg-orange-50 text-orange-600': diet.mealType === 'BREAKFAST',
                    'bg-amber-50 text-amber-600': diet.mealType === 'LUNCH',
                    'bg-slate-800 text-white': diet.mealType === 'DINNER',
                    'bg-purple-50 text-purple-600': diet.mealType === 'SNACK',
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
                <span class="text-xs text-slate-400 flex items-center gap-0.5">
                  <Clock :size="10" />
                  {{ diet.eatTime }}
                </span>

                <!-- 개별 식단 챌린지 뱃지 (TIME_RANGE) -->
                <template v-if="challengeType === 'TIME_RANGE' && diet.mealType === 'BREAKFAST'">
                  <span
                    v-if="parseInt((diet.eatTime ?? '24:00').split(':')[0] || '0') < (targetValue || 0)"
                    class="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold"
                  >
                    성공
                  </span>
                  <span
                    v-else
                    class="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold"
                  >
                    지각
                  </span>
                </template>
              </div>
              <div class="text-right">
                <span class="font-bold text-slate-700 text-sm"
                  >{{ Math.round(diet.totalCalories) }} kcal</span
                >
              </div>
            </div>

            <!-- 내용 -->
            <div class="flex gap-4 items-center">
              <!-- 이미지 -->
              <div
                v-if="diet.dietImgUrl"
                class="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50"
              >
                <img :src="diet.dietImgUrl" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0"
              >
                <Utensils :size="20" />
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-800 text-sm truncate mb-0.5">
                  {{ getSummaryFoodName(diet) }}
                </p>
                <p class="text-xs text-slate-400 truncate">{{ diet.memo || '메모 없음' }}</p>
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
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
