<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits(['close', 'confirm']);

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div class="bg-white rounded-2xl w-full max-w-xs p-6 relative z-10 shadow-xl overflow-hidden animate-pop">
        <h3 v-if="title" class="text-lg font-bold mb-2 text-center text-gray-900">{{ title }}</h3>
        <p class="text-gray-600 text-center mb-6 whitespace-pre-wrap leading-relaxed decoration-slice">{{ message }}</p>
        
        <div class="flex gap-3">
          <button 
            @click="$emit('close')"
            class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
          >
            {{ cancelText || '취소' }}
          </button>
          <button 
            @click="handleConfirm"
            class="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
          >
            {{ confirmText || '확인' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.animate-pop {
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
