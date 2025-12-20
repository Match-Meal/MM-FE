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

    // 1. 임시 토큰(tempToken)이 있는지 확인 (탈퇴 유저 복구용)
    // 백엔드에서 리다이렉트 시 ?tempToken=... 으로 준다고 가정 (일반 토큰과 구분 필요하거나, accessToken 필드에 주되 Role 확인)
    // 사용자 설명: "임시 토큰(ROLE_WITHDRAWN, 5분 유효) 발급 및 프론트로 리다이렉트"
    // 따라서 accessToken에 들어있을 수 있음. fetchUser 결과로 판단.

    await authStore.fetchUser()

    if (authStore.user?.role === 'ROLE_WITHDRAWN') {
      router.replace('/recovery')
      return
    }

    if (isNew) {
      router.replace('/profile-intro')
    } else {
      router.replace('/home')
    }
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
