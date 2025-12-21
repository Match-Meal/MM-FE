<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const isProcessing = ref(false)

const handleRestore = async () => {
  if (isProcessing.value) return
  isProcessing.value = true

  try {
    await authStore.reactivate()
    toastStore.show('계정이 성공적으로 복구되었습니다! 🎉', 'success')
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
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col items-center justify-center p-8 text-center"
    >
      <div class="mb-6 text-6xl">👋</div>

      <h1 class="text-2xl font-bold text-gray-900 mb-2">다시 만나서 반가워요!</h1>
      <p class="text-gray-500 mb-8 leading-relaxed">
        회원님은 잠시 떠나 계셨군요.<br />
        계정 정보가 아직 보관되어 있어<br />
        바로 <strong>복구</strong>하실 수 있습니다.
      </p>

      <div class="bg-blue-50 p-6 rounded-2xl w-full mb-8">
        <p class="text-sm text-blue-800 font-bold mb-1">💡 데이터 보존 안내</p>
        <p class="text-xs text-blue-600">
          탈퇴 후 3개월 내에는<br />
          기존의 모든 기록을 되살릴 수 있습니다.
        </p>
      </div>

      <div class="w-full space-y-3">
        <button
          @click="handleRestore"
          :disabled="isProcessing"
          class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center"
        >
          <div
            v-if="isProcessing"
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
          ></div>
          계정 복구하고 시작하기
        </button>

        <button
          @click="handleCancel"
          class="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition text-sm"
        >
          아니요, 로그인하지 않을래요
        </button>
      </div>
    </div>
  </div>
</template>
