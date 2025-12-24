<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getDailyDiets, type DailyDietResponseItem } from '@/services/dietService'
import { useDietStore } from '@/stores/dietStore'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import BottomNav from '@/components/common/BottomNav.vue'
import { 
  ArrowLeft, 
  BarChart2, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Utensils, 
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  AlertCircle
} from 'lucide-vue-next'

dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.locale('ko')

const router = useRouter()
const dietStore = useDietStore()
const { selectedDate } = storeToRefs(dietStore)

const dietList = ref<DailyDietResponseItem[]>([])
const dailyTotalCalories = ref(0)
const isLoading = ref(false)

const fetchData = async () => {
  isLoading.value = true
  try {
    const response = await getDailyDiets(selectedDate.value)

    if (Array.isArray(response)) {
      dietList.value = response
      dailyTotalCalories.value = response.reduce((acc, cur) => acc + (cur.totalCalories || 0), 0)
    } else if (response && response.diets) {
      dietList.value = response.diets || []
      dailyTotalCalories.value = response.totalCalories || 0
    } else {
      dietList.value = []
      dailyTotalCalories.value = 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

watch(selectedDate, () => {
  fetchData()
})

const changeDate = (diff: number) => {
  const newDate = dayjs(selectedDate.value).add(diff, 'day').format('YYYY-MM-DD')
  dietStore.setDate(newDate)
}

// --- 캘린더 관련 로직 ---
const showCalendar = ref(false)
const calendarDate = ref(dayjs()) // 캘린더에서 보고 있는 월 기준 날짜

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value
  if (showCalendar.value) {
    calendarDate.value = dayjs(selectedDate.value) // 현재 선택된 날짜의 월로 시작
  }
}

const changeMonth = (diff: number) => {
  calendarDate.value = calendarDate.value.add(diff, 'month')
}

const selectCalendarDate = (date: string) => {
  dietStore.setDate(date)
  showCalendar.value = false
}

const calendarGrid = computed(() => {
  const startOfMonth = calendarDate.value.startOf('month')
  const endOfMonth = calendarDate.value.endOf('month')
  const startDay = startOfMonth.day() // 0(일) ~ 6(토)
  const daysInMonth = calendarDate.value.daysInMonth()

  // 이전 달 날짜 채우기
  const prevMonthDays = []
  for (let i = 0; i < startDay; i++) {
    prevMonthDays.unshift({
      date: startOfMonth.subtract(i + 1, 'day').format('YYYY-MM-DD'),
      isCurrentMonth: false,
      day: startOfMonth.subtract(i + 1, 'day').date(),
    })
  }

  // 현재 달 날짜 채우기
  const currentMonthDays = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      date: startOfMonth.date(i).format('YYYY-MM-DD'),
      isCurrentMonth: true,
      day: i,
    })
  }

  // 다음 달 날짜 채우기 (총 6주 42칸 채우기, 또는 5주 35칸)
  // 여기선 심플하게 나머지만 채움
  const totalDays = [...prevMonthDays, ...currentMonthDays]
  const remaining = 7 - (totalDays.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      totalDays.push({
        date: endOfMonth.add(i, 'day').format('YYYY-MM-DD'),
        isCurrentMonth: false,
        day: i,
      })
    }
  }

  return totalDays
})

const goRecord = () => {
  dietStore.resetCurrentDiet()
  // 날짜는 현재 보고 있는 날짜로 설정
  dietStore.currentDiet.eatDate = selectedDate.value
  router.push('/diet/record')
}

const goToDetail = (item: DailyDietResponseItem) => {
  // 상세 화면으로 이동
  router.push(`/diet/detail/${item.dietId}`)
}

const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('M월 D일 (ddd)')
}

const mealLabel = (type: string) => {
  const types: Record<string, string> = {
    BREAKFAST: '아침',
    LUNCH: '점심',
    DINNER: '저녁',
    SNACK: '간식',
  }
  return types[type] || type
}

import type { Component } from 'vue'

const getMealIconInfo = (type: string) => {
  const icons: Record<string, { icon: Component; color: string; bg: string }> = {
    BREAKFAST: { icon: Coffee, color: 'text-primary-600', bg: 'bg-primary-100' },
    LUNCH: { icon: Sun, color: 'text-white', bg: 'bg-primary-400' },
    DINNER: { icon: Moon, color: 'text-white', bg: 'bg-primary-600' },
    SNACK: { icon: Cookie, color: 'text-amber-900', bg: 'bg-accent' },
  }
  return icons[type] || { icon: Utensils, color: 'text-primary-500', bg: 'bg-primary-100' }
}
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <!-- Header -->
      <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="router.push('/home')" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">식단 관리</h1>
        <div class="w-8 flex justify-end">
          <button @click="router.push('/diet/stats')" class="p-2 -mr-2 rounded-full hover:bg-slate-50 transition text-slate-600">
              <BarChart2 :size="24" />
          </button>
        </div>
      </header>

      <!-- MainContent -->
      <main class="flex-1 overflow-y-auto bg-slate-50 pb-20 relative no-scrollbar">
        <div class="p-6 flex justify-between items-center bg-white shadow-sm mb-2 z-10 relative">
          <h2 class="font-bold text-xl text-slate-800">오늘의 식단</h2>
          <div class="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
            총 {{ Math.round(dailyTotalCalories) }} kcal
          </div>
        </div>

        <!-- Date Navigation -->
        <div
          class="px-4 mb-4 flex justify-center gap-4 items-center text-sm py-3 bg-white sticky top-0 z-10 shadow-sm relative border-b border-slate-100"
        >
          <button @click="changeDate(-1)" class="text-slate-400 p-1 hover:bg-slate-50 rounded-full transition">
              <ChevronLeft :size="24" />
          </button>
          
          <span
            @click="toggleCalendar"
            class="font-bold text-lg cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-xl transition flex items-center gap-2 select-none"
          >
            {{ formatDate(selectedDate) }} 
            <CalendarIcon :size="18" class="text-slate-400" />
          </span>

          <button @click="changeDate(1)" class="text-slate-400 p-1 hover:bg-slate-50 rounded-full transition">
              <ChevronRight :size="24" />
          </button>

          <!-- Calendar Modal Overlay -->
          <div
            v-if="showCalendar"
            class="absolute top-full mt-2 bg-white rounded-2xl shadow-float border border-slate-100 p-4 w-[320px] z-50 animate-fade-in left-1/2 -translate-x-1/2"
          >
            <div class="flex justify-between items-center mb-4">
              <button
                @click.stop="changeMonth(-1)"
                class="text-slate-400 p-1 hover:bg-slate-50 rounded transition"
              >
                <ChevronLeft :size="20" />
              </button>
              <span class="font-bold text-slate-800">{{ calendarDate.format('YYYY년 M월') }}</span>
              <button
                @click.stop="changeMonth(1)"
                class="text-slate-400 p-1 hover:bg-slate-50 rounded transition"
              >
                <ChevronRight :size="20" />
              </button>
            </div>
            <div class="grid grid-cols-7 text-center text-xs text-slate-400 mb-2 font-medium">
              <div class="text-rose-500">일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div class="text-primary-500">토</div>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center">
              <button
                v-for="day in calendarGrid"
                :key="day.date"
                @click.stop="selectCalendarDate(day.date)"
                class="h-9 w-9 rounded-full flex items-center justify-center text-sm transition font-medium"
                :class="[
                  !day.isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-100',
                  day.date === selectedDate
                    ? 'bg-primary-600 text-white font-bold hover:bg-primary-700 !shadow-md'
                    : '',
                ]"
              >
                {{ day.day }}
              </button>
            </div>
          </div>
          <!-- Backdrop for closing -->
          <div
            v-if="showCalendar"
            @click="showCalendar = false"
            class="fixed inset-0 z-40 bg-black/5"
          ></div>
        </div>

        <!-- List -->
        <div class="px-5 space-y-4 pb-24">
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
             <div class="w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
             <span class="text-xs">불러오는 중...</span>
          </div>
          <template v-else>
            <div
              v-for="item in dietList"
              :key="item.dietId"
              @click="goToDetail(item)"
              class="bg-white p-4 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 cursor-pointer group hover:-translate-y-0.5"
            >
              <div class="flex gap-4">
                  <div
                    class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl overflow-hidden shrink-0 transition-colors"
                     :class="!item.dietImgUrl ? getMealIconInfo(item.mealType).bg : 'bg-slate-100'"
                  >
                    <img
                      v-if="item.dietImgUrl"
                      :src="item.dietImgUrl"
                      class="w-full h-full object-cover"
                      alt="식단 사진"
                    />
                    <component 
                        v-else 
                        :is="getMealIconInfo(item.mealType).icon" 
                        :class="getMealIconInfo(item.mealType).color"
                        :size="28" 
                        stroke-width="2"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                      <div class="flex flex-col">
                        <span
                          class="font-extrabold text-[10px] px-2 py-0.5 rounded-full mb-1.5 inline-block w-fit tracking-wide"
                           :class="[getMealIconInfo(item.mealType).bg, getMealIconInfo(item.mealType).color]"
                        >
                          {{ mealLabel(item.mealType) }}
                        </span>
                        <h3 class="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {{
                            item.details.map((d) => d.foodName).join(', ') || item.memo || '식단 기록'
                          }}
                        </h3>
                      </div>
                    </div>
                     <div class="flex items-center justify-end mt-2">
                        <span class="text-sm font-bold text-slate-600 whitespace-nowrap">
                            {{ Math.round(item.totalCalories) }} <span class="text-xs font-normal text-slate-400">kcal</span>
                        </span>
                    </div>
                  </div>
              </div>
            </div>

            <div
              v-if="dietList.length === 0"
              class="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 gap-3"
            >
              <AlertCircle :size="32" class="text-slate-300" />
              <div class="text-center text-sm font-medium">
                  기록된 식단이 없습니다.<br />
                  <span class="text-primary-600 font-bold">+ 버튼</span>을 눌러 기록해보세요!
              </div>
            </div>
          </template>
        </div>

        <!-- FAB -->
      </main>

      <button
        @click="goRecord"
        class="absolute bottom-24 right-6 w-14 h-14 bg-accent text-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center z-30 hover:brightness-105 hover:scale-105 transition-all duration-300 active:scale-95 group"
      >
        <Plus :size="28" stroke-width="2.5" class="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <BottomNav />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
