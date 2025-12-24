<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden p-6">
      <!-- Header Image / Icon -->
      <div class="bg-yellow-400 p-8 flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-20 w-20 text-gray-800"
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

      <!-- Content -->
      <div class="p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">프리미엄 구독</h2>
        <p class="text-gray-500 mb-6">매월 정기 결제로 더 많은 혜택을 누려보세요!</p>

        <ul class="text-left text-sm text-gray-600 mb-8 space-y-3">
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>무제한 AI 식단 분석</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>전용 커뮤니티 접근 권한</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>광고 없는 쾌적한 환경</span>
          </li>
        </ul>

        <div class="text-3xl font-bold text-gray-900 mb-8">
          ₩9,900 <span class="text-sm font-normal text-gray-500">/ 월</span>
        </div>

        <button
          @click="subscribe"
          :disabled="loading"
          class="w-full bg-[#FFEB00] hover:bg-[#FADB00] text-gray-900 font-bold py-3 px-4 rounded-xl shadow transition duration-300 flex justify-center items-center"
        >
          <span v-if="!loading">카카오페이로 구독하기</span>
          <span v-else class="loader"></span>
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { paymentService } from '@/services/paymentService'

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
</script>

<style scoped>
.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
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
</style>
