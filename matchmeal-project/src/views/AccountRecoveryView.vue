<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Loader2, UserCheck, HelpCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const isProcessing = ref(false)

const handleRestore = async () => {
  if (isProcessing.value) return
  isProcessing.value = true

  try {
    await authStore.reactivate()
    toastStore.show('계정이 성공적으로 복구되었습니다.', 'success')
    router.replace('/home')
  } catch (error) {
    console.error(error)
    toastStore.show('계정 복구에 실패했습니다.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const handleCancel = () => {
  // 로그아웃 처리 후 로그인 화면으로
  authStore.logout()
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white relative overflow-hidden">
      <div class="mb-6 w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 animate-bounce-slow">
         <UserCheck :size="48" />
      </div>

      <h1 class="text-2xl font-bold text-slate-900 mb-2">다시 만나서 반가워요!</h1>
      <p class="text-slate-500 mb-8 leading-relaxed text-sm">
        회원님은 잠시 떠나 계셨군요.<br />
        계정 정보가 아직 보관되어 있어<br />
        바로 <strong class="text-primary-600">복구</strong>하실 수 있습니다.
      </p>

      <div class="bg-blue-50 p-6 rounded-2xl w-full mb-8 border border-blue-100">
        <p class="text-sm text-blue-800 font-bold mb-1 flex items-center justify-center gap-1.5"><HelpCircle :size="16" /> 데이터 보존 안내</p>
        <p class="text-xs text-blue-600 leading-relaxed">
          탈퇴 후 3개월 내에는<br />
          기존의 모든 기록을 되살릴 수 있습니다.
        </p>
      </div>

      <div class="w-full space-y-3">
        <button
          @click="handleRestore"
          :disabled="isProcessing"
          class="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:brightness-110 text-white font-bold rounded-2xl transition shadow-lg shadow-primary-200 active:scale-95 flex items-center justify-center gap-2"
        >
          <Loader2
            v-if="isProcessing"
            class="animate-spin"
            :size="20"
          />
          계정 복구하고 시작하기
        </button>

        <button
          @click="handleCancel"
          class="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition text-sm"
        >
          아니요, 로그인하지 않을래요
        </button>
      </div>
  </div>
</template>

<style scoped>
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
.animate-bounce-slow {
  animation: bounce-slow 2s infinite;
}
</style>
