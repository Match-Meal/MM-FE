<script setup lang="ts">
import { ref, computed } from 'vue'
import { Utensils, Bot, Apple, Flame, ChevronRight, X, PieChart, MessageCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentSlide = ref(0)
const slides = [
  {
    title: 'Match Meal 시작하기',
    description: '나만의 맞춤형 식단 관리,\n이제 시작해볼까요?',
    icon: Utensils,
    color: 'text-primary-500',
    bg: 'bg-primary-50'
  },
  {
    title: '식단 기록 & 통계',
    description: '매일 먹은 음식을 기록하고\n섭취 칼로리와 영양 통계를 확인하세요.',
    icon: PieChart,
    color: 'text-orange-500',
    bg: 'bg-orange-50'
  },
  {
    title: 'AI 코치 & 음식 사전',
    description: 'AI에게 식단 조언을 구하고\n궁금한 음식 정보를 검색해보세요.',
    icon: Bot,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    title: '커뮤니티 & 챌린지',
    description: '유저들과 소통하고 챌린지에 참여하며\n함께 건강한 습관을 만들어보세요.',
    icon: MessageCircle,
    color: 'text-red-500',
    bg: 'bg-red-50'
  }
]

const nextSlide = () => {
  if (currentSlide.value < slides.length - 1) {
    currentSlide.value++
  } else {
    emit('close')
  }
}

const activeSlide = computed(() => slides[currentSlide.value] || slides[0])
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in text-center">
    <div class="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
      <!-- Close Button (Top Right) -->
      <button 
        @click="$emit('close')" 
        class="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition"
      >
        <X :size="24" />
      </button>

        <!-- Carousel Content -->
        <div class="w-full flex-1 flex flex-col items-center justify-center min-h-[320px]">
          <Transition name="slide-fade" mode="out-in">
            <div 
              :key="currentSlide" 
              v-if="activeSlide"
              class="flex flex-col items-center gap-6 w-full"
            >
              <!-- Illustrative Icon -->
              <div 
                class="w-32 h-32 rounded-full flex items-center justify-center mb-4 transition-colors duration-500"
                :class="activeSlide.bg"
              >
                <component 
                  :is="activeSlide.icon" 
                  :size="64" 
                  :class="activeSlide.color" 
                  stroke-width="1.5"
                />
              </div>

              <!-- Text -->
              <div class="space-y-3">
                <h3 class="text-2xl font-bold text-slate-800 break-keep">
                  {{ activeSlide.title }}
                </h3>
                <p class="text-slate-500 whitespace-pre-line leading-relaxed">
                  {{ activeSlide.description }}
                </p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Indicators -->
        <div class="flex gap-2 mb-8 mt-4">
          <div 
            v-for="(_, index) in slides" 
            :key="index"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="index === currentSlide ? 'w-6 bg-primary-500' : 'bg-gray-200'"
          ></div>
        </div>

        <!-- Action Button -->
        <button
          @click="nextSlide"
          class="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold text-lg hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-2"
        >
          {{ currentSlide === slides.length - 1 ? '시작하기' : '다음' }}
          <ChevronRight v-if="currentSlide !== slides.length - 1" :size="20" />
        </button>
      </div>
    </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Custom fade in for modal background */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
