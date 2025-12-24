<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import { Loader2 } from 'lucide-vue-next'

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
  <div class="flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden">
      <div class="text-center flex flex-col items-center">
        <Loader2 class="text-primary-600 animate-spin mb-4" :size="48" />
        <h2 class="text-xl font-bold text-slate-800 mb-2">로그인 처리 중...</h2>
        <p class="text-slate-500 text-sm">잠시만 기다려 주세요.</p>
      </div>
  </div>
</template>
