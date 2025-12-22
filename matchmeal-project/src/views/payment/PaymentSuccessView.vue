<template>
  <!-- 전체 배경 (중앙 정렬용) -->
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <!-- 모바일 프레임 -->
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col items-center justify-center p-8 text-center"
    >
      <div v-if="success" class="animate-bounce mb-8">
        <div class="rounded-3xl bg-green-100 p-6 shadow-md">
          <svg
            class="h-20 w-20 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <div v-else-if="error" class="mb-8">
        <div class="rounded-3xl bg-red-100 p-6 shadow-md">
          <svg class="h-20 w-20 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      <div v-else class="mb-8">
        <div class="loader"></div>
      </div>

      <h2 class="text-2xl font-extrabold text-slate-800 mb-3 animate-fade-up">
        {{ message }}
      </h2>

      <p
        v-if="success"
        class="text-slate-500 mb-10 text-sm leading-relaxed animate-fade-up delay-100"
      >
        환영합니다! 이제 모든 프리미엄 기능을<br />무제한으로 이용하실 수 있습니다.
      </p>

      <router-link
        to="/home"
        class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 animate-fade-up delay-200"
      >
        홈으로 돌아가기
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { paymentService } from '@/services/paymentService'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const success = ref(false)
const error = ref(false)
const message = ref('결제 승인 중입니다...')

onMounted(async () => {
  const pgToken = route.query.pg_token as string
  const userIdFromQuery = route.query.userId as string // 백엔드가 파라미터로 넘겨준다면 사용

  // 현재 로그인된 사용자 ID 사용 (가장 안전)
  const currentUserId = authStore.user?.id

  if (!pgToken) {
    error.value = true
    message.value = '잘못된 접근입니다. (토큰 누락)'
    return
  }

  // 만약 백엔드에서 userId를 넘겨주지 않는다면, 로컬 스토리지의 유저 정보 사용
  // 주의: 원래는 pgToken만으로도 세션 통해 처리 가능하면 좋음
  const targetUserId = currentUserId
    ? Number(currentUserId)
    : userIdFromQuery
      ? Number(userIdFromQuery)
      : 0

  try {
    await paymentService.approve(pgToken, targetUserId)
    success.value = true
    message.value = '구독이 성공적으로 완료되었습니다!'

    // 유저 정보 갱신 (권한 변경 반영) 필요 시 호출
    // await authStore.fetchUser();
  } catch (err: unknown) {
    console.error(err)
    error.value = true
    message.value = '결제 승인에 실패했습니다.'
  }
})
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3c1e1e;
  border-radius: 50%;
  width: 48px;
  height: 48px;
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
  opacity: 0;
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
