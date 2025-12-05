<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // URL 쿼리 파라미터에서 토큰 추출
  const accessToken = route.query.accessToken as string
  const isNew = route.query.isNew === 'true'

  if (accessToken) {
    // pinia 스토어에 토큰 저장
    authStore.setToken(accessToken)

    // 사용자 정보 가져오기 (비동기)
    await authStore.fetchUser()

    if (isNew) {
    }

    // 홈 화면으로 이동
    router.replace('/home')
  } else {
    alert('로그인에 실패했습니다. 다시 시도해주세요.')
    router.replace('/login')
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-white">
    <div class="text-center">
      <div class="text-4xl mb-4 animate-spin">🌀</div>
      <h2 class="text-xl font-bold">로그인 처리 중...</h2>
      <p class="text-gray-500">잠시만 기다려 주세요.</p>
    </div>
  </div>
</template>
