<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Trophy, ChevronRight } from 'lucide-vue-next'
import { useRankingStore } from '@/stores/rankingStore'

const emit = defineEmits(['open'])
const store = useRankingStore()

const currentIndex = ref(0)
const transitionName = ref('slide-up')

// Top 5 items only for the ticker
const topItems = computed(() => {
  return store.rankingData.all.slice(0, 5)
})

const currentItem = computed(() => {
  if (topItems.value.length === 0) return null
  return topItems.value[currentIndex.value]
})

let intervalId: number | null = null

const startTicker = () => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  
  intervalId = window.setInterval(() => {
    if (topItems.value.length === 0) return
    
    transitionName.value = 'slide-up'
    currentIndex.value = (currentIndex.value + 1) % topItems.value.length
  }, 3000)
}

watch(() => store.rankingData.all, (newVal) => {
  if (newVal.length > 0 && !intervalId) {
    startTicker()
  }
})

onMounted(() => {
  store.connect()
  if (topItems.value.length > 0) {
    startTicker()
  }
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div>
    <!-- Ticker Bar -->
    <div 
      @click="emit('open')"
      class="bg-white rounded-2xl p-4 shadow-smooth flex items-center justify-between cursor-pointer active:scale-98 transition-transform group relative overflow-hidden"
    >
        <!-- Background shimmer effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:animate-shimmer pointer-events-none"></div>

      <div class="flex items-center gap-3 flex-1 overflow-hidden z-10">
        <div class="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
          <Trophy :size="20" />
        </div>
        
        <div class="flex-1 h-10 relative overflow-hidden">
             <Transition :name="transitionName" mode="out-in">
                <div 
                    v-if="currentItem"
                    :key="currentIndex" 
                    class="absolute inset-0 flex flex-col justify-center"
                >
                    <div class="flex items-center gap-2">
                        <span class="font-black text-slate-800 text-sm italic">
                            {{ currentIndex + 1 }}<span class="text-[10px] text-slate-400 font-normal not-italic ml-0.5">위</span>
                        </span>
                        <span class="font-bold text-slate-700 text-sm truncate max-w-[120px]">
                            {{ currentItem.foodName }}
                        </span>
                        <span class="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded ml-auto">
                            {{ currentItem.eatCount }}회
                        </span>
                    </div>
                </div>
                <div 
                    v-else 
                    class="flex items-center text-slate-400 text-sm h-full"
                >
                    랭킹 데이터를 불러오는 중...
                </div>
             </Transition>
        </div>
      </div>

      <div class="text-gray-300 group-hover:text-primary-500 transition-colors pl-2 z-10">
        <ChevronRight :size="18" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes shimmer {
    0% { transform: translateX(-200%); }
    100% { transform: translateX(200%); }
}

.animate-shimmer {
    animation: shimmer 1.5s infinite linear;
}
</style>
