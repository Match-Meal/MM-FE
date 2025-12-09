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
             day: startOfMonth.subtract(i + 1, 'day').date()
        })
    }
    
    // 현재 달 날짜 채우기
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push({
            date: startOfMonth.date(i).format('YYYY-MM-DD'),
            isCurrentMonth: true,
            day: i
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
                day: i
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
        'BREAKFAST': '아침',
        'LUNCH': '점심',
        'DINNER': '저녁',
        'SNACK': '간식'
    }
    return types[type] || type
}

const getMealIcon = (type: string) => {
    const icons: Record<string, string> = {
        'BREAKFAST': '🥪',
        'LUNCH': '🍱',
        'DINNER': '🥗',
        'SNACK': '🍎'
    }
    return icons[type] || '🍽️'
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
      
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button @click="router.push('/home')" class="text-2xl w-8">←</button>
        <h1 class="font-bold text-lg truncate">식단 관리</h1>
        <div class="w-8"></div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 pb-20 relative">
        <div class="p-4 flex justify-between items-center bg-white shadow-sm mb-2">
            <h2 class="font-bold text-xl">오늘의 식단</h2>
            <div class="text-sm font-bold text-blue-600">
                총 {{ Math.round(dailyTotalCalories) }} kcal
            </div>
        </div>

        <!-- Date Navigation -->
        <div class="px-4 mb-4 flex justify-center gap-4 items-center text-sm py-2 bg-white sticky top-0 z-10 shadow-sm relative">
            <button @click="changeDate(-1)" class="text-gray-400 text-xl px-2">&lt;</button>
            <span @click="toggleCalendar" class="font-bold text-lg cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition flex items-center gap-1">
                {{ formatDate(selectedDate) }} 📅
            </span>
            <button @click="changeDate(1)" class="text-gray-400 text-xl px-2">&gt;</button>
            
            <!-- Calendar Modal Overlay -->
             <div v-if="showCalendar" class="absolute top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[320px] z-50 animate-fade-in left-1/2 -translate-x-1/2">
                <div class="flex justify-between items-center mb-4">
                    <button @click.stop="changeMonth(-1)" class="text-gray-400 p-1 hover:bg-gray-50 rounded">&lt;</button>
                    <span class="font-bold text-gray-800">{{ calendarDate.format('YYYY년 M월') }}</span>
                    <button @click.stop="changeMonth(1)" class="text-gray-400 p-1 hover:bg-gray-50 rounded">&gt;</button>
                </div>
                <div class="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
                    <div class="text-red-500">일</div>
                    <div>월</div>
                    <div>화</div>
                    <div>수</div>
                    <div>목</div>
                    <div>금</div>
                    <div class="text-blue-500">토</div>
                </div>
                <div class="grid grid-cols-7 gap-1 text-center">
                    <button
                        v-for="day in calendarGrid"
                        :key="day.date"
                        @click.stop="selectCalendarDate(day.date)"
                        class="h-8 w-8 rounded-full flex items-center justify-center text-sm transition"
                        :class="[
                            !day.isCurrentMonth ? 'text-gray-300' : 'text-gray-800 hover:bg-gray-100',
                            day.date === selectedDate ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''
                        ]"
                    >
                        {{ day.day }}
                    </button>
                </div>
             </div>
             <!-- Backdrop for closing -->
             <div v-if="showCalendar" @click="showCalendar = false" class="fixed inset-0 z-40 bg-transparent"></div>
        </div>

        <!-- List -->
        <div class="px-4 space-y-3 pb-24">
            <div v-if="isLoading" class="text-center py-10 text-gray-400">Loading...</div>
            <template v-else>
                <div 
                    v-for="item in dietList" 
                    :key="item.dietId" 
                    @click="goToDetail(item)"
                    class="bg-white p-4 rounded-xl shadow-sm flex gap-4 cursor-pointer hover:bg-gray-50 transition border border-gray-100"
                >
                    <div class="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                        {{ getMealIcon(item.mealType) }}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div class="flex flex-col">
                                <span class="font-bold text-blue-600 text-[10px] bg-blue-50 px-2 py-0.5 rounded-full mb-1 inline-block w-fit">
                                    {{ mealLabel(item.mealType) }}
                                </span>
                                <h3 class="font-bold text-sm line-clamp-1">
                                    {{ item.details.map(d => d.foodName).join(', ') || item.memo || '식단 기록' }}
                                </h3>
                            </div>
                            <span class="text-sm font-bold text-gray-800 whitespace-nowrap ml-2">
                                {{ Math.round(item.totalCalories) }} kcal
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="dietList.length === 0" class="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                    기록된 식단이 없습니다.<br>
                    + 버튼을 눌러 기록해보세요!
                </div>
            </template>
        </div>

        <!-- FAB -->
        <button 
            @click="goRecord" 
            class="absolute bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-xl text-3xl flex items-center justify-center z-10 hover:scale-105 transition"
        >
            +
        </button>
      </main>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
