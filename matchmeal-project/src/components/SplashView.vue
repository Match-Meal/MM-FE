<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Wheat } from 'lucide-vue-next'

const show = ref(false)

onMounted(() => {
  // Mount되면 애니메이션 시작
  setTimeout(() => {
    show.value = true
  }, 50)
})
</script>

<template>
  <div class="absolute inset-0 z-10 flex items-center justify-center bg-primary-50 overflow-hidden">
    <!-- Background Circles -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-100/50 blur-3xl animate-float-slow"></div>
        <div class="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl animate-float-delayed"></div>
    </div>

    <div 
      class="relative flex flex-col items-center justify-center transition-all duration-1000 transform"
      :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
    >
      <!-- Logo Container -->
      <div class="relative mb-6">
        <div class="relative w-24 h-24 bg-white rounded-3xl shadow-float flex items-center justify-center z-10 animate-bounce-subtle">
          <Wheat :size="48" class="text-primary-600" />
        </div>
        <!-- Ripple Effect -->
        <div class="absolute inset-0 bg-primary-400 rounded-3xl animate-ping opacity-20"></div>
      </div>

      <!-- Text -->
      <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
        Match<span class="text-primary-600">Meal</span>
      </h1>
      <p class="text-slate-500 font-medium text-sm tracking-wide">
        건강한 식단의 시작
      </p>
    </div>

    <!-- Advertisement Space (Moved out of centered div) -->
    <div class="absolute bottom-12 left-6 right-6">
      <div class="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-sm animate-fade-in-delayed">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-amber-700">
            <span class="text-xs font-bold font-sans">AD</span>
          </div>
          <div class="flex-1">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Recommended</p>
            <p class="text-xs text-slate-700 font-bold line-clamp-1">광고주세요 제발</p>
          </div>
        </div>
      </div>
      <p class="text-center text-[9px] text-slate-300 mt-2">이 광고는 서비스 무료 제공을 위해 표시됩니다.</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-delayed {
  animation: fadeIn 0.8s ease-out 0.5s both;
}

/* Shadow Utility matching other screens */
.shadow-float {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04), 0 4px 10px rgba(0, 0, 0, 0.02);
}
</style>
