<script setup lang="ts">
import { ref } from 'vue'
import { useToastStore } from '@/stores/toast'
import { Lock } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'submit'])
const toastStore = useToastStore()
const code = ref('')

const handleSubmit = () => {
  if (code.value.length < 1) return toastStore.show('코드를 입력해주세요', 'warning')
  emit('submit', code.value)
  code.value = ''
}
</script>

<template>
  <div
    v-if="isOpen"
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in"
  >
    <div class="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-float animate-scale-up text-center relative overflow-hidden">
      <!-- Decorative Background Icon -->
      <Lock :size="120" class="absolute -top-4 -right-4 text-slate-50/50 rotate-12 -z-0" />

      <div class="relative z-10">
        <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-iner text-slate-700">
            <Lock :size="32" stroke-width="2.5" />
        </div>

        <h3 class="text-xl font-bold text-slate-800 mb-2">비공개 챌린지 참여</h3>
        <p class="text-sm text-slate-500 mb-8 font-medium">초대받은 코드를 입력하여<br/>챌린지에 참여하세요.</p>

        <input
            v-model="code"
            type="text"
            placeholder="초대 코드 입력"
            class="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-center text-xl font-bold mb-6 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 transition uppercase placeholder:text-slate-300 tracking-widest"
        />

        <div class="flex gap-3">
            <button
            @click="$emit('close')"
            class="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition active:scale-[0.98]"
            >
            취소
            </button>
            <button
            @click="handleSubmit"
            class="flex-1 h-14 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-200 transition active:scale-[0.98]"
            >
            참여하기
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
