import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmStore = defineStore('confirm', () => {
  // State
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const confirmText = ref('확인')
  const cancelText = ref('취소')

  // Promise resolve 함수 저장
  let resolvePromise: (value: boolean) => void = () => {}

  // Actions
  const show = (msg: string, ttl?: string, btnConfirm?: string, btnCancel?: string) => {
    message.value = msg
    title.value = ttl || '알림'
    confirmText.value = btnConfirm || '확인'
    cancelText.value = btnCancel || '취소'
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const confirm = () => {
    isOpen.value = false
    resolvePromise(true)
  }

  const cancel = () => {
    isOpen.value = false
    resolvePromise(false)
  }

  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    show,
    confirm,
    cancel,
  }
})
