import { defineStore } from 'pinia'
import { ref } from 'vue'

// 타입 정의 추가
export type ToastType = 'success' | 'error' | 'info'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const isVisible = ref(false)
  const type = ref<ToastType>('info') // 타입 상태 추가 (기본값 info)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  // show 함수 파라미터 수정 (type 추가)
  const show = (msg: string, toastType: ToastType = 'info', duration = 2000) => {
    message.value = msg
    type.value = toastType // 타입 설정
    isVisible.value = true

    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      isVisible.value = false
    }, duration)
  }

  return { message, isVisible, type, show }
})
