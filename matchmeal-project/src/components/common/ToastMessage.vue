<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertOctagon
} from 'lucide-vue-next'

const toastStore = useToastStore()

// 타입별 스타일 설정
// lucide 아이콘 매핑
const icons = {
  success: CheckCircle2,
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
}

const typeClasses = {
  success: 'bg-emerald-600 text-white shadow-emerald-200',
  error: 'bg-rose-500 text-white shadow-rose-200',
  warning: 'bg-amber-500 text-white shadow-amber-200',
  info: 'bg-slate-800 text-white shadow-slate-200',
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="toastStore.isVisible"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 px-5 py-3.5 rounded-full shadow-float z-[9999] flex items-center gap-3 backdrop-blur-md transition-all duration-300 min-w-[300px] justify-center"
      :class="typeClasses[toastStore.type] || typeClasses.info"
    >
      <component
        :is="icons[toastStore.type] || icons.info"
        :size="20"
        stroke-width="2.5"
        class="shrink-0"
      />
      <span class="text-sm font-bold tracking-wide">{{ toastStore.message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 40px) scale(0.9);
}
</style>
