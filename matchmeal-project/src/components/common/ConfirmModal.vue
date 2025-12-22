<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';

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
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div 
        class="bg-white rounded-[32px] w-full max-w-[320px] p-6 relative z-10 shadow-float overflow-hidden flex flex-col items-center text-center animate-pop"
      >
        <div class="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 shrink-0">
            <AlertCircle :size="32" stroke-width="2.5" />
        </div>
        
        <h3 v-if="title" class="text-xl font-bold mb-2 text-slate-800">{{ title }}</h3>
        <p class="text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed text-sm font-medium px-2 break-keep">{{ message }}</p>
        
        <div class="flex gap-3 w-full">
          <button 
            @click="$emit('close')"
            class="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition text-sm active:scale-[0.98]"
          >
            {{ cancelText || '취소' }}
          </button>
          <button 
            @click="handleConfirm"
            class="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition text-sm active:scale-[0.98]"
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
    animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
