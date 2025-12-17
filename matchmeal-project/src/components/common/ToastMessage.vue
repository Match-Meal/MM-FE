<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

// 타입별 배경색 설정
const typeClass = {
  success: 'bg-green-600/90',
  error: 'bg-red-500/90',
  info: 'bg-gray-800/90',
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="toastStore.isVisible"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm transition-colors duration-300"
      :class="typeClass[toastStore.type] || typeClass.info"
    >
      <span class="text-lg">
        {{ toastStore.type === 'success' ? '✅' : toastStore.type === 'error' ? '⚠️' : 'ℹ️' }}
      </span>
      <span class="text-sm font-medium">{{ toastStore.message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
