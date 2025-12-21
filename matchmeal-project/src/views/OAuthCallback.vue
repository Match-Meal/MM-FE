<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // URL 쿼리 파라미터 추출
  const { accessToken, isNew, status, tempToken } = route.query

  // 1. 탈퇴한 유저인 경우 (백엔드 OAuth2FailureHandler에서 status=withdrawn, tempToken 전달)
  if (status === 'withdrawn' && tempToken) {
    authStore.setToken(tempToken as string)
    router.replace('/recovery')
    return
  }

  // 2. 정상 로그인 (accessToken 존재)
  if (accessToken) {
    authStore.setToken(accessToken as string)

    try {
      await authStore.fetchUser()

      // 안전장치: 혹시 토큰으로 ROLE_WITHDRAWN이 넘어온 경우도 처리
      if (authStore.user?.role === 'ROLE_WITHDRAWN') {
        router.replace('/recovery')
        return
      }

      if (isNew === 'true') {
        router.replace('/profile-intro')
      } else {
        router.replace('/home')
      }
    } catch (e) {
      console.error(e)
      alert('사용자 정보를 불러오는데 실패했습니다.')
      router.replace('/login')
    }
  } else {
    // 3. 실패 (error=true 등)
    const message = route.query.message || '로그인에 실패했습니다.'
    alert(message)
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
