<script setup lang="ts">
import { ref } from 'vue'
import { paymentService } from '@/services/paymentService'
import { useToastStore } from '@/stores/toast'
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  nextBillingDate: string | null
}>()

const emit = defineEmits(['close', 'cancelled'])
const toastStore = useToastStore()

const loading = ref(false)

const cancelSubscription = async () => {
  loading.value = true
  try {
    await paymentService.cancel()
    toastStore.show('구독이 성공적으로 해지되었습니다.', 'success')
    emit('cancelled')
    emit('close')
  } catch (error) {
    console.error('Cancellation failed:', error)
    toastStore.show('해지 처리 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="close"></div>

    <!-- Modal Content -->
    <div
      class="bg-white w-full max-w-sm rounded-[2rem] p-6 relative z-10 animate-scale-in shadow-2xl flex flex-col items-center text-center"
    >
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle :size="32" class="text-red-500" />
      </div>

      <h3 class="text-xl font-bold text-slate-800 mb-2">정말 구독을 해지하시겠어요?</h3>

      <div
        class="text-sm text-slate-500 mb-8 leading-relaxed break-keep bg-slate-50 p-4 rounded-xl w-full"
      >
        <p class="mb-2">지금 해지하셔도</p>
        <p class="font-bold text-slate-700 text-base mb-2">
          {{ nextBillingDate || '다음 결제일' }}까지
        </p>
        <p>프리미엄 혜택을 이용하실 수 있습니다.</p>
        <p class="text-xs text-slate-400 mt-2">이후 자동으로 일반 회원으로 전환됩니다.</p>
      </div>

      <div class="w-full space-y-3">
        <button
          @click="close"
          class="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all"
        >
          구독 유지하기
        </button>

        <button
          @click="cancelSubscription"
          :disabled="loading"
          class="w-full py-3.5 text-red-500 bg-red-50 rounded-xl font-bold text-sm hover:bg-red-100 transition disabled:opacity-50"
        >
          {{ loading ? '처리 중...' : '네, 해지할게요' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
