<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Wheat } from 'lucide-vue-next'

const show = ref(false)
const showAd = ref(false)

onMounted(() => {
  // Mount되면 애니메이션 시작
  setTimeout(() => {
    show.value = true
  }, 50)

  // 로고 애니메이션(1s) 후 광고 표시
  setTimeout(() => {
    showAd.value = true
  }, 1200)
})
</script>

<template>
  <div class="absolute inset-0 z-10 flex items-center justify-center bg-primary-50 overflow-hidden">
    <!-- Background Circles -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-100/50 blur-3xl animate-float-slow"
      ></div>
      <div
        class="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl animate-float-delayed"
      ></div>
    </div>

    <div
      class="flex flex-col h-full p-8 justify-center z-10 transition-all duration-1000 transform"
      :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
    >
      <!-- Logo Container -->
      <div class="flex flex-col items-center mb-12">
        <div class="relative mb-6">
          <div
            class="relative w-24 h-24 bg-white rounded-3xl shadow-float flex items-center justify-center z-10 animate-bounce-subtle"
          >
            <Wheat :size="48" class="text-primary-600" />
          </div>
          <!-- Ripple Effect -->
          <div class="absolute inset-0 bg-primary-400 rounded-3xl animate-ping opacity-20"></div>
        </div>

        <!-- Text -->
        <h1 class="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
          Match<span class="text-primary-600">Meal</span>
        </h1>
        <p class="text-slate-500 font-medium tracking-wide">건강한 식단의 시작</p>
      </div>

      <!-- Spacer to match LoginView layout (Invisble buttons area) -->
      <div class="w-full space-y-4 invisible pointer-events-none">
        <div class="w-full h-14"></div>
        <div class="w-full h-14"></div>
      </div>
    </div>

    <!-- Advertisement Space (Moved out of centered div) -->
    <div class="absolute bottom-12 left-6 right-6">
      <div
        class="relative h-48 overflow-hidden bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm group transition-all duration-1000 transform"
        :class="showAd ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
      >
        <!-- Background Service Image -->
        <div class="absolute inset-0 z-0">
          <img
            src="/Cochelin.png"
            alt="Service Intro"
            class="w-full h-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-105"
          />
          <!-- Gradient Overlay for Contrast (Vertical) -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          ></div>
        </div>

        <!-- Content (Bottom Aligned) -->
        <div class="relative z-10 w-full h-full p-4 flex flex-col justify-end">
          <div class="flex items-center gap-4">
            <!-- Logo with Glow Effect -->
            <div class="relative">
              <div
                class="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-lg ring-1 ring-white/50"
              >
                <img src="/logo_brown.svg" alt="AD Logo" class="w-full h-full object-contain" />
              </div>
            </div>

            <!-- Text -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-0.5">
                <span
                  class="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-md shadow-sm"
                >
                  AD
                </span>
                <p class="text-[10px] text-zinc-300 font-bold uppercase tracking-widest shadow-sm">
                  내 취향에 맞는 커피 찾기
                </p>
              </div>
              <p class="text-lg text-white font-extrabold line-clamp-1 drop-shadow-sm">Cochelin</p>
              <p class="text-xs text-zinc-200 font-medium line-clamp-1">
                AI가 분석하는 나만의 커피 취향, 지금 확인하세요
              </p>
            </div>
          </div>
        </div>
      </div>
      <p class="text-center text-[9px] text-slate-300 mt-2">
        이 광고는 서비스 무료 제공을 위해 표시됩니다.
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes bounceSubtle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-float-slow {
  animation: float 8s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 10s ease-in-out infinite reverse;
}

.animate-bounce-subtle {
  animation: bounceSubtle 2s ease-in-out infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-delayed {
  animation: fadeIn 0.8s ease-out 0.5s both;
}

/* Shadow Utility matching other screens */
.shadow-float {
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.04),
    0 4px 10px rgba(0, 0, 0, 0.02);
}
</style>
