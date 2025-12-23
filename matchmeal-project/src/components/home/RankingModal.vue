<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Trophy, Utensils, Sunrise, Sun, Sunset, Coffee } from 'lucide-vue-next'
import { useRankingStore } from '@/stores/rankingStore'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const store = useRankingStore()

const activeTab = ref<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all')

const tabs = [
  { id: 'all', label: '전체', icon: Trophy },
  { id: 'breakfast', label: '아침', icon: Sunrise },
  { id: 'lunch', label: '점심', icon: Sun },
  { id: 'dinner', label: '저녁', icon: Sunset },
  { id: 'snack', label: '간식', icon: Coffee },
] as const

const currentList = computed(() => {
  return store.rankingData[activeTab.value] || []
})

const maxCount = computed(() => {
  if (currentList.value.length === 0) return 1
  return Math.max(...currentList.value.map(item => item.eatCount))
})

const getBarWidth = (count: number) => {
  return (count / maxCount.value) * 100
}

const getRankColor = (index: number) => {
  if (index === 0) return 'bg-yellow-400 text-white' // Gold
  if (index === 1) return 'bg-gray-300 text-gray-700' // Silver
  if (index === 2) return 'bg-amber-600 text-white' // Bronze
  return 'bg-slate-100 text-slate-500'
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm" @click.self="emit('close')">
      <div class="bg-white w-full h-full flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up relative">
        <!-- Header -->
        <div class="flex-none p-5 pb-2 bg-white z-10">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy class="text-yellow-500" :size="20" />
              인기 음식 랭킹
            </h3>
            <button @click="emit('close')" class="text-gray-300 hover:text-gray-500 transition p-1 hover:bg-gray-100 rounded-full">
              <X :size="20" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex items-center justify-between overflow-x-auto scrollbar-hide pb-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex-1"
              :class="activeTab === tab.id 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'"
            >
              <component :is="tab.icon" :size="12" />
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">
          <div v-if="currentList.length > 0" class="space-y-2">
            <div
              v-for="(item, index) in currentList"
              :key="item.foodName"
              class="relative bg-white border border-slate-100 rounded-xl p-2.5 flex items-center gap-3 hover:border-primary-100 transition-colors group"
            >
              <!-- Rank Badge -->
              <div 
                class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm shrink-0"
                :class="getRankColor(index)"
              >
                {{ index + 1 }}
              </div>

              <div class="flex-1 z-10 relative">
                <div class="flex justify-between items-end mb-1">
                  <span class="font-bold text-xs text-slate-700 truncate max-w-[140px]">{{ item.foodName }}</span>
                  <span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">
                    {{ item.eatCount.toLocaleString() }}회
                  </span>
                </div>
                
                <!-- Bar -->
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-1000 ease-out"
                    :class="index < 3 ? 'bg-primary-500' : 'bg-slate-300'"
                    :style="{ width: getBarWidth(item.eatCount) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 gap-3 pb-20">
            <Utensils :size="32" class="opacity-20" />
            <p class="font-medium text-xs">아직 랭킹 데이터가 없어요</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
