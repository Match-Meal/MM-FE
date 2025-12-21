<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toastStore = useToastStore()

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
      toastStore.show('사용자 정보를 불러오는데 실패했습니다.', 'error')
      router.replace('/login')
    }
  } else {
    // 3. 실패 (error=true 등)
    const message = (route.query.message as string) || '로그인에 실패했습니다.'
    toastStore.show(message, 'error')
    router.replace('/login')
  }
})
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col items-center justify-center"
    >
      <div class="text-center">
        <div class="text-4xl mb-4 animate-spin">🌀</div>
        <h2 class="text-xl font-bold">로그인 처리 중...</h2>
        <p class="text-gray-500">잠시만 기다려 주세요.</p>
      </div>
    </div>
  </div>
</template>
