<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'submit'])
const code = ref('')

const handleSubmit = () => {
  if (code.value.length < 1) return alert('코드를 입력해주세요')
  emit('submit', code.value)
  code.value = ''
}
</script>

<template>
  <div
    v-if="isOpen"
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fade-in"
  >
    <div class="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-up">
      <h3 class="text-xl font-bold text-gray-800 mb-2">🔒 비공개 챌린지 참여</h3>
      <p class="text-sm text-gray-500 mb-6">초대받은 코드를 입력하여 챌린지에 참여하세요.</p>

      <input
        v-model="code"
        type="text"
        placeholder="초대 코드 입력"
        class="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 text-center text-lg font-bold mb-6 focus:outline-none focus:border-blue-500 focus:bg-white transition uppercase"
      />

      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
        >
          취소
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
        >
          참여하기
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
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
