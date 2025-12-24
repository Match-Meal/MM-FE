<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw, X } from 'lucide-vue-next'
import { paymentService } from '@/services/paymentService'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  isOpen: boolean
  nextBillingDate: string
}>()

const emit = defineEmits(['close', 'reactivated'])

const toastStore = useToastStore()
const authStore = useAuthStore()

const loading = ref(false)

const close = () => {
  emit('close')
}

const reactivateSubscription = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await paymentService.reactivate()
    toastStore.show('구독이 성공적으로 재활성화되었습니다.', 'success')
    // 즉시 사용자 정보 갱신
    await authStore.fetchUser()
    emit('reactivated')
    close()
  } catch (error) {
    console.error(error)
    toastStore.show('구독 재활성화에 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
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
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition"
      >
        <X :size="20" />
      </button>

      <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <RefreshCw :size="32" class="text-blue-500 animate-spin-slow" />
      </div>

      <h3 class="text-xl font-bold text-slate-800 mb-2">구독을 다시 시작할까요?</h3>

      <div
        class="text-sm text-slate-500 mb-8 leading-relaxed break-keep bg-slate-50 p-4 rounded-xl w-full"
      >
        <p class="mb-2">지금 다시 시작하시면</p>
        <p class="font-bold text-slate-700 text-base mb-2">
          {{ nextBillingDate || '예정된 날짜' }}
        </p>
        <p>에 결제가 진행되며,</p>
        <p>기존 혜택을 그대로 이어서 이용하실 수 있습니다.</p>
      </div>

      <div class="w-full space-y-3">
        <button
          @click="reactivateSubscription"
          :disabled="loading"
          class="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          <span v-if="!loading">네, 다시 구독할게요</span>
          <span v-else class="loader"></span>
        </button>

        <button
          @click="close"
          class="w-full py-3.5 text-slate-400 font-bold text-sm hover:text-slate-600 transition"
        >
          다음에 할게요
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scale-in {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}
</style>
