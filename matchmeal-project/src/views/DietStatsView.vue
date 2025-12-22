<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getDietStats, type DietStatsResponse, type DailyStat } from '@/services/dietService';
import dayjs from 'dayjs';
import { 
    ArrowLeft, 
    Activity,
    PieChart,
    BarChart3,
    Lightbulb
} from 'lucide-vue-next';

const router = useRouter();

const periodType = ref<'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('WEEKLY');
const startDate = ref('');
const endDate = ref('');

const stats = ref<DietStatsResponse | null>(null);
const isLoading = ref(false);

const fetchData = async () => {
    try {
        isLoading.value = true;
        
        // Custom Validation
        if (periodType.value === 'CUSTOM' && (!startDate.value || !endDate.value)) {
            return;
        }

        stats.value = await getDietStats(periodType.value, startDate.value, endDate.value);
    } catch (e) {
        console.error(e);
    } finally {
        isLoading.value = false;
    }
};

const changePeriod = (type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM') => {
    periodType.value = type;
    if (type !== 'CUSTOM') {
        fetchData();
    }
};

onMounted(() => {
    fetchData();
});

const goBack = () => router.back();

// Chart Logic
const fullChartData = computed(() => {
    if (!stats.value || !stats.value.dailyStats) return [];
    return stats.value.dailyStats;
});

const sampledIndices = computed(() => {
    const data = fullChartData.value;
    if (data.length <= 7) return data.map((_, i) => i);
    
    // Pick 7 evenly spaced indices
    const indices: number[] = [];
    const step = (data.length - 1) / 6;
    for (let i = 0; i < 7; i++) {
        indices.push(Math.round(i * step));
    }
    // Remove duplicates if any (though logic prevents it mostly) and sort
    return [...new Set(indices)].sort((a, b) => a - b);
});

const maxCalories = computed(() => {
    if (fullChartData.value.length === 0) return 2500;
    return Math.max(...fullChartData.value.map(d => d.totalCalories), 2000) * 1.2;
});

const getPoints = () => {
    if (fullChartData.value.length === 0) return '';
    
    // SVG Coordinate System: 300 x 150
    // We add padding x: 10 each side -> effective width 280, start 10
    const width = 280;
    const height = 150;
    const startX = 10;
    const max = maxCalories.value;
    
    return fullChartData.value.map((d, i) => {
        const x = startX + (i / (fullChartData.value.length - 1)) * width;
        const y = height - (d.totalCalories / max) * height;
        return `${x},${y}`;
    }).join(' ');
};

const getDateLabel = (date: string) => dayjs(date).format('M/D');

// Tooltip Logic
const hoveredStat = ref<DailyStat | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });

const onDotEnter = (stat: DailyStat, event: MouseEvent) => {
    hoveredStat.value = stat;
    updateTooltipPos(event);
};

const updateTooltipPos = (event: MouseEvent) => {
   tooltipPosition.value = { x: event.clientX, y: event.clientY };
};

const onDotLeave = () => {
    hoveredStat.value = null;
};

// Helper for template to sync X position logic
const getXPosPercent = (index: number, length: number) => {
    // ((10 + (index / (length - 1)) * 280) / 300) * 100
    return ((10 + (index / (length - 1)) * 280) / 300) * 100;
};
</script>

<template>
<div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col">
        
        <!-- Header -->
        <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
            <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
                <ArrowLeft :size="24" />
            </button>
            <h1 class="font-bold text-lg truncate text-slate-800">식단 통계</h1>
            <div class="w-8"></div>
        </header>

        <main class="flex-1 overflow-y-auto bg-slate-50 pb-10 no-scrollbar">
            
            <!-- Controls -->
            <div class="p-4 bg-white shadow-sm mb-4">
                <div class="flex p-1 bg-slate-100 rounded-xl mb-4">
                    <button 
                        @click="changePeriod('WEEKLY')"
                        class="flex-1 py-2 text-xs font-bold rounded-lg transition"
                        :class="periodType === 'WEEKLY' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'"
                    >1주일</button>
                    <button 
                        @click="changePeriod('MONTHLY')"
                        class="flex-1 py-2 text-xs font-bold rounded-lg transition"
                        :class="periodType === 'MONTHLY' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'"
                    >1개월</button>
                    <button 
                        @click="changePeriod('CUSTOM')"
                        class="flex-1 py-2 text-xs font-bold rounded-lg transition"
                        :class="periodType === 'CUSTOM' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'"
                    >직접입력</button>
                </div>

                <div v-if="periodType === 'CUSTOM'" class="flex items-center gap-2 mb-2">
                    <input type="date" v-model="startDate" class="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 h-9 flex-1 outline-none focus:border-primary-500">
                    <span class="text-slate-400">~</span>
                    <input type="date" v-model="endDate" class="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 h-9 flex-1 outline-none focus:border-primary-500">
                    <button @click="fetchData" class="bg-primary-600 text-white text-xs px-4 h-9 rounded-lg font-bold hover:bg-primary-700 transition">조회</button>
                </div>
            </div>

            <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <div class="w-8 h-8 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
                <span class="text-xs">데이터 분석 중...</span>
            </div>

            <div v-else-if="stats" class="px-4 space-y-4">
                
                <!-- Summary Card -->
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h3 class="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5">
                        <Activity :size="14" />
                        기간 요약 ({{ stats.periodTotalDays }}일)
                    </h3>
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-4xl font-black text-primary-600 tracking-tight">{{ Math.round(stats.averageCalories) }}</span>
                        <span class="text-sm font-bold text-slate-600 mb-1">kcal / 일</span>
                    </div>
                </div>

                <!-- CPF Ratio Card -->
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h3 class="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5">
                        <PieChart :size="14" />
                        탄단지 밸런스
                    </h3>
                    
                    <!-- Ratio Bar -->
                    <div class="h-5 w-full rounded-full overflow-hidden flex mb-3 shadow-inner">
                        <div class="bg-blue-400 h-full flex items-center justify-center text-[10px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.carbRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.carbRatio) }}%
                        </div>
                        <div class="bg-emerald-400 h-full flex items-center justify-center text-[10px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.proteinRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.proteinRatio) }}%
                        </div>
                        <div class="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.fatRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.fatRatio) }}%
                        </div>
                    </div>
                    
                    <div class="flex justify-between text-[11px] text-slate-500 mb-4 px-1 font-medium">
                        <span class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-blue-400"></div>탄수화물</span>
                        <span class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>단백질</span>
                        <span class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>지방</span>
                    </div>

                    <div class="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 leading-relaxed font-medium border border-slate-100 flex gap-2">
                        <Lightbulb :size="16" class="text-amber-500 shrink-0 mt-0.5" />
                        <span>{{ stats.cpfRatioAnalysis.feedback }}</span>
                    </div>
                </div>

                <!-- Sodium & Sugar Analysis -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Sodium -->
                    <div class="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-xs font-bold text-slate-500">나트륨</h3>
                            <span 
                                class="text-[10px] px-2 py-0.5 rounded-lg font-bold"
                                :class="stats.sodiumAnalysis.status === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                            >{{ stats.sodiumAnalysis.status }}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-xl font-black text-slate-800">{{ stats.sodiumAnalysis.currentIntake }}</span>
                            <span class="text-[10px] text-slate-400"> / {{ stats.sodiumAnalysis.recommendedLimit }}mg</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div class="bg-purple-500 h-full rounded-full" :style="{ width: Math.min(stats.sodiumAnalysis.intakePercentage, 100) + '%' }"></div>
                        </div>
                    </div>

                    <!-- Sugar -->
                    <div class="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-xs font-bold text-slate-500">당류</h3>
                            <span 
                                class="text-[10px] px-2 py-0.5 rounded-lg font-bold"
                                :class="stats.sugarAnalysis.status === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                            >{{ stats.sugarAnalysis.status }}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-xl font-black text-slate-800">{{ stats.sugarAnalysis.currentIntake }}</span>
                            <span class="text-[10px] text-slate-400"> / {{ stats.sugarAnalysis.recommendedLimit }}g</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div class="bg-pink-500 h-full rounded-full" :style="{ width: Math.min(stats.sugarAnalysis.intakePercentage, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>

                <!-- Daily Chart (Line Graph) -->
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative z-0">
                    <h3 class="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1.5">
                        <BarChart3 :size="14" />
                        일별 칼로리 추이
                    </h3>
                    
                    <div class="flex">
                        <!-- Y-Axis Labels -->
                        <div class="flex flex-col justify-between text-[10px] text-slate-300 h-40 pb-6 pr-2 text-right w-8 shrink-0 font-medium">
                            <span>{{ Math.round(maxCalories) }}</span>
                            <span>{{ Math.round(maxCalories / 2) }}</span>
                            <span>0</span>
                        </div>

                        <!-- Graph Area -->
                         <div class="relative flex-1 h-40">
                             <!-- SVG Line Chart: 300x150 for approx 2:1 aspect ratio to keep circles rounder -->
                             <svg viewBox="0 0 300 150" preserveAspectRatio="none" class="w-full h-[130px] overflow-visible">
                                <!-- Dashed Grid Lines -->
                                <line x1="10" y1="0" x2="290" y2="0" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4" />
                                <line x1="10" y1="75" x2="290" y2="75" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4" />
                                <line x1="10" y1="150" x2="290" y2="150" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4" />
    
                                <!-- Path (High Res) -->
                                <polyline
                                    :points="getPoints()"
                                    fill="none"
                                    stroke="#3b82f6"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    vector-effect="non-scaling-stroke"
                                />
    
                                <!-- Interactive Dots (All points) -->
                                <circle 
                                    v-for="(day, index) in fullChartData"
                                    :key="day.date + index"
                                    :cx="10 + (index / (fullChartData.length - 1)) * 280"
                                    :cy="150 - (day.totalCalories / maxCalories) * 150"
                                    r="3"
                                    fill="white"
                                    stroke="#cbd5e1"
                                    stroke-width="2"
                                    vector-effect="non-scaling-stroke"
                                    class="cursor-pointer transition-all"
                                    :class="{ '!fill-primary-600 !stroke-primary-200 !stroke-[4] !r-[5]': sampledIndices.includes(index) || hoveredStat?.date === day.date }" 
                                    @mouseenter="onDotEnter(day, $event)"
                                    @mouseleave="onDotLeave"
                                >
                                </circle>
                             </svg>
    
                             <!-- X-axis Labels (Sampled) -->
                             <div class="absolute w-full flex justify-between top-[140px] px-0">
                                 <template v-for="index in sampledIndices" :key="'label-'+index">
                                     <div 
                                        v-if="fullChartData[index]"
                                        class="text-[10px] text-slate-400 absolute transform -translate-x-1/2 whitespace-nowrap font-medium"
                                        :style="{ left: getXPosPercent(index, fullChartData.length) + '%' }"
                                     >
                                        {{ getDateLabel(fullChartData[index].date) }}
                                     </div>
                                 </template>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tooltip Portal (Floating) -->
            <div 
                v-if="hoveredStat"
                class="fixed bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl font-bold pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-2 shadow-lg"
                :style="{ left: tooltipPosition.x + 'px', top: (tooltipPosition.y - 10) + 'px' }"
            >
                <div>{{ hoveredStat.date }}</div>
                <div class="text-primary-300">{{ hoveredStat.totalCalories }}kcal</div>
            </div>

        </main>
    </div>
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
</style>
