<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, X } from 'lucide-vue-next'
import SubscriptionModal from '@/components/payment/SubscriptionModal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const router = useRouter()

const isSubscriptionModalOpen = ref(false)

const close = () => {
  emit('close')
}

const openSubscriptionModal = () => {
  // 현재 모달은 닫지 않고 그 위에 띄우거나,
  // UX상 현재 모달을 닫고 구독 모달을 여는 것이 깔끔함
  // 하지만 여기서는 간단히 구독 모달을 띄우는 것으로 처리
  isSubscriptionModalOpen.value = true
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div
      class="bg-white w-full max-w-[320px] rounded-[2rem] p-6 relative z-10 animate-fade-up shadow-2xl flex flex-col items-center text-center"
    >
      <button
        @click="close"
        class="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition"
      >
        <X :size="20" />
      </button>

      <div
        class="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center mb-5 shadow-inner"
      >
        <Sparkles class="text-amber-500" :size="32" />
      </div>

      <h3 class="text-xl font-bold text-slate-800 mb-2">구독이 필요한 기능입니다</h3>

      <p class="text-sm text-slate-500 mb-6 leading-relaxed break-keep">
        AI 영양 상담, 식단 분석 등<br />
        프리미엄 기능을 무제한으로 이용해보세요!
      </p>

      <div class="w-full space-y-3">
        <button
          @click="openSubscriptionModal"
          class="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-200 hover:scale-[1.02] active:scale-95 transition-all"
        >
          멤버십 알아보기
        </button>

        <button
          @click="close"
          class="w-full py-3 text-slate-400 text-xs font-medium hover:text-slate-600 transition"
        >
          다음에 할게요
        </button>
      </div>
    </div>
  </div>

  <!-- 구독 모달 -->
  <SubscriptionModal :is-open="isSubscriptionModalOpen" @close="isSubscriptionModalOpen = false" />
</template>

<style scoped>
.animate-fade-up {
  animation: fadeUp 0.3s ease-out forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
