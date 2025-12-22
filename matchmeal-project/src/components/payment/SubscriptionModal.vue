<script setup lang="ts">
import { ref } from 'vue'
import { paymentService } from '@/services/paymentService'
import { X, Check } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const loading = ref(false)

const subscribe = async () => {
  loading.value = true
  try {
    const response = await paymentService.ready()

    // PC/Mobile 환경에 따라 리다이렉트 URL 선택 (여기선 PC URL 사용)
    const redirectUrl = response.next_redirect_pc_url

    if (redirectUrl) {
      window.location.href = redirectUrl
    } else {
      alert('결제 URL을 받아오지 못했습니다.')
    }
  } catch (error) {
    console.error('Payment preparation failed:', error)
    alert('결제 준비 중 오류가 발생했습니다.')
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
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div
      class="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden relative z-10 animate-fade-up shadow-2xl flex flex-col"
    >
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-gray-800 transition z-20"
      >
        <X :size="24" />
      </button>

      <!-- Header -->
      <div class="bg-yellow-400 p-10 flex justify-center items-center relative overflow-hidden">
        <div class="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div
          class="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"
        ></div>

        <div class="relative z-10 bg-white p-4 rounded-3xl shadow-lg shadow-yellow-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8 text-center bg-white">
        <h2 class="text-2xl font-extrabold text-slate-800 mb-2">프리미엄 구독</h2>
        <p class="text-slate-500 mb-8 text-sm break-keep">
          매월 정기 결제로 AI 코칭을 무제한으로 즐겨보세요!
        </p>

        <ul class="text-left text-sm text-slate-600 mb-8 space-y-4 px-4">
          <li class="flex items-start gap-3">
            <div
              class="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0"
            >
              <Check :size="12" class="text-green-600 font-bold" />
            </div>
            <span class="font-medium">무제한 AI 식단, 메뉴 추천</span>
          </li>
          <li class="flex items-start gap-3">
            <div
              class="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0"
            >
              <Check :size="12" class="text-green-600 font-bold" />
            </div>
            <span class="font-medium">AI 챗봇 히스토리 무기한 보관</span>
          </li>
          <li class="flex items-start gap-3">
            <div
              class="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0"
            >
              <Check :size="12" class="text-green-600 font-bold" />
            </div>
            <span class="font-medium">프리미엄 전용 뱃지 및 프로필 테두리</span>
          </li>
        </ul>

        <div class="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
          ₩9,900 <span class="text-xs font-bold text-slate-400 align-middle">/ 월</span>
        </div>

        <button
          @click="subscribe"
          :disabled="loading"
          class="w-full bg-[#fae100] hover:bg-[#ffe500] text-[#3c1e1e] font-extrabold py-4 px-4 rounded-2xl shadow-lg shadow-yellow-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-[15px]"
        >
          <span v-if="!loading" class="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="inline-block"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                opacity="0.3"
              />
              <path
                d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                fill="currentColor"
              />
            </svg>
            카카오페이로 3초만에 시작하기
          </span>
          <span v-else class="loader"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3c1e1e;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animate-fade-up {
  animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
