<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();
</script>

<template>
  <Transition name="toast">
    <div 
      v-if="toastStore.isVisible"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 backdrop-blur-sm"
    >
      <span class="text-sm font-medium">{{ toastStore.message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
