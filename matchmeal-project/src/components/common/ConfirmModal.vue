<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

defineEmits(['close', 'confirm'])
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-[60] flex items-center justify-center px-6">
    <!-- 배경 (어둡게) -->
    <div
      class="absolute inset-0 bg-black/60 transition-opacity animate-fade-in"
      @click="$emit('close')"
    ></div>

    <!-- 모달 박스 -->
    <div
      class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center animate-scale-up"
    >
      <h3 class="text-lg font-bold text-gray-800 mb-2">{{ title }}</h3>
      <p class="text-sm text-gray-500 mb-6 whitespace-pre-wrap">{{ message }}</p>

      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
        >
          {{ cancelText || '취소' }}
        </button>
        <button
          @click="$emit('confirm')"
          class="flex-1 h-11 bg-red-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-600 transition"
        >
          {{ confirmText || '확인' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
.animate-scale-up {
  animation: scaleUp 0.2s ease-out forwards;
}
</style>
