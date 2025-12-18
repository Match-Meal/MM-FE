<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getDietStats, type DietStatsResponse, type DailyStat } from '@/services/dietService';
import dayjs from 'dayjs';

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
<div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col">
        
        <!-- Header -->
        <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
            <button @click="goBack" class="text-2xl w-8">←</button>
            <h1 class="font-bold text-lg truncate">식단 통계</h1>
            <div class="w-8"></div>
        </header>

        <main class="flex-1 overflow-y-auto bg-gray-50 pb-10 no-scrollbar">
            
            <!-- Controls -->
            <div class="p-4 bg-white shadow-sm mb-4">
                <div class="flex p-1 bg-gray-100 rounded-lg mb-4">
                    <button 
                        @click="changePeriod('WEEKLY')"
                        class="flex-1 py-1.5 text-xs font-bold rounded-md transition"
                        :class="periodType === 'WEEKLY' ? 'bg-white shadow text-blue-600' : 'text-gray-400'"
                    >1주일</button>
                    <button 
                        @click="changePeriod('MONTHLY')"
                        class="flex-1 py-1.5 text-xs font-bold rounded-md transition"
                        :class="periodType === 'MONTHLY' ? 'bg-white shadow text-blue-600' : 'text-gray-400'"
                    >1개월</button>
                    <button 
                        @click="changePeriod('CUSTOM')"
                        class="flex-1 py-1.5 text-xs font-bold rounded-md transition"
                        :class="periodType === 'CUSTOM' ? 'bg-white shadow text-blue-600' : 'text-gray-400'"
                    >직접입력</button>
                </div>

                <div v-if="periodType === 'CUSTOM'" class="flex items-center gap-2 mb-2">
                    <input type="date" v-model="startDate" class="bg-gray-100 text-xs rounded px-2 h-8 flex-1">
                    <span class="text-gray-400">~</span>
                    <input type="date" v-model="endDate" class="bg-gray-100 text-xs rounded px-2 h-8 flex-1">
                    <button @click="fetchData" class="bg-blue-600 text-white text-xs px-3 h-8 rounded font-bold">조회</button>
                </div>
            </div>

            <div v-if="isLoading" class="flex justify-center py-20 text-gray-400">
                Loading...
            </div>

            <div v-else-if="stats" class="px-4 space-y-4">
                
                <!-- Summary Card -->
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 class="text-xs font-bold text-gray-400 mb-4">기간 요약 ({{ stats.periodTotalDays }}일)</h3>
                    <div class="flex items-end gap-1">
                        <span class="text-4xl font-extrabold text-blue-600">{{ Math.round(stats.averageCalories) }}</span>
                        <span class="text-sm font-bold text-gray-600 mb-2">kcal / 일</span>
                    </div>
                </div>

                <!-- CPF Ratio Card -->
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 class="text-xs font-bold text-gray-400 mb-4">탄단지 밸런스</h3>
                    
                    <!-- Ratio Bar -->
                    <div class="h-4 w-full rounded-full overflow-hidden flex mb-2">
                        <div class="bg-blue-400 h-full flex items-center justify-center text-[8px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.carbRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.carbRatio) }}%
                        </div>
                        <div class="bg-green-400 h-full flex items-center justify-center text-[8px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.proteinRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.proteinRatio) }}%
                        </div>
                        <div class="bg-yellow-400 h-full flex items-center justify-center text-[8px] text-white font-bold" :style="{ width: stats.cpfRatioAnalysis.fatRatio + '%' }">
                            {{ Math.round(stats.cpfRatioAnalysis.fatRatio) }}%
                        </div>
                    </div>
                    
                    <div class="flex justify-between text-[10px] text-gray-500 mb-4 px-1">
                        <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-blue-400"></i>탄수화물</span>
                        <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-green-400"></i>단백질</span>
                        <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-yellow-400"></i>지방</span>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed font-medium">
                        💡 {{ stats.cpfRatioAnalysis.feedback }}
                    </div>
                </div>

                <!-- Sodium & Sugar Analysis -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Sodium -->
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xs font-bold text-gray-500">나트륨</h3>
                            <span 
                                class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                :class="stats.sodiumAnalysis.status === 'GOOD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                            >{{ stats.sodiumAnalysis.status }}</span>
                        </div>
                        <div class="mb-2">
                            <span class="text-lg font-bold">{{ stats.sodiumAnalysis.currentIntake }}</span>
                            <span class="text-[10px] text-gray-400"> / {{ stats.sodiumAnalysis.recommendedLimit }}mg</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-purple-500 h-full rounded-full" :style="{ width: Math.min(stats.sodiumAnalysis.intakePercentage, 100) + '%' }"></div>
                        </div>
                    </div>

                    <!-- Sugar -->
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xs font-bold text-gray-500">당류</h3>
                            <span 
                                class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                :class="stats.sugarAnalysis.status === 'GOOD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                            >{{ stats.sugarAnalysis.status }}</span>
                        </div>
                        <div class="mb-2">
                            <span class="text-lg font-bold">{{ stats.sugarAnalysis.currentIntake }}</span>
                            <span class="text-[10px] text-gray-400"> / {{ stats.sugarAnalysis.recommendedLimit }}g</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-pink-500 h-full rounded-full" :style="{ width: Math.min(stats.sugarAnalysis.intakePercentage, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>

                <!-- Daily Chart (Line Graph) -->
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative z-0">
                    <h3 class="text-xs font-bold text-gray-400 mb-6">일별 칼로리 추이</h3>
                    
                    <div class="flex">
                        <!-- Y-Axis Labels -->
                        <div class="flex flex-col justify-between text-[10px] text-gray-400 h-40 pb-6 pr-2 text-right w-8 shrink-0">
                            <span>{{ Math.round(maxCalories) }}</span>
                            <span>{{ Math.round(maxCalories / 2) }}</span>
                            <span>0</span>
                        </div>

                        <!-- Graph Area -->
                         <div class="relative flex-1 h-40">
                             <!-- SVG Line Chart: 300x150 for approx 2:1 aspect ratio to keep circles rounder -->
                             <svg viewBox="0 0 300 150" preserveAspectRatio="none" class="w-full h-[130px] overflow-visible">
                                <!-- Dashed Grid Lines -->
                                <line x1="10" y1="0" x2="290" y2="0" stroke="#eee" stroke-width="0.5" stroke-dasharray="2" />
                                <line x1="10" y1="75" x2="290" y2="75" stroke="#eee" stroke-width="0.5" stroke-dasharray="2" />
                                <line x1="10" y1="150" x2="290" y2="150" stroke="#eee" stroke-width="0.5" stroke-dasharray="2" />
    
                                <!-- Path (High Res) -->
                                <polyline
                                    :points="getPoints()"
                                    fill="none"
                                    stroke="#3b82f6"
                                    stroke-width="1.5"
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
                                    fill="transparent"
                                    stroke="transparent"
                                    stroke-width="4"
                                    vector-effect="non-scaling-stroke"
                                    class="cursor-pointer transition-all"
                                    :class="{ '!fill-white !stroke-blue-500 !stroke-1': sampledIndices.includes(index) || hoveredStat?.date === day.date }" 
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
                                        class="text-[10px] text-gray-400 absolute transform -translate-x-1/2 whitespace-nowrap"
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
                class="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-2"
                :style="{ left: tooltipPosition.x + 'px', top: (tooltipPosition.y - 10) + 'px' }"
            >
                <div>{{ hoveredStat.date }}</div>
                <div class="font-bold">{{ hoveredStat.totalCalories }}kcal</div>
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
