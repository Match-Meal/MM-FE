<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  loading: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

const startDate = ref('')
const endDate = ref('')

// 모달 열릴 때 날짜 초기화 (내일 ~ 3일 뒤)
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      startDate.value = tomorrow.toISOString().split('T')[0]

      const after3Days = new Date(tomorrow)
      after3Days.setDate(after3Days.getDate() + 2)
      endDate.value = after3Days.toISOString().split('T')[0]
    }
  },
)

const handleConfirm = () => {
  if (!startDate.value || !endDate.value) return
  emit('confirm', { start: startDate.value, end: endDate.value })
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div
      class="bg-white w-full max-w-[320px] rounded-[2rem] p-6 relative z-10 animate-fade-up shadow-2xl"
    >
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition"
      >
        <X :size="20" />
      </button>

      <div class="flex items-center gap-2 mb-6">
        <div
          class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600"
        >
          <Calendar :size="20" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">식단 추천 기간 설정</h3>
      </div>

      <div class="space-y-4 mb-8">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 ml-1">시작일</label>
          <input
            type="date"
            v-model="startDate"
            class="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border border-slate-200 focus:outline-none focus:border-primary-500 transition text-slate-700"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 ml-1">종료일</label>
          <input
            type="date"
            v-model="endDate"
            class="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border border-slate-200 focus:outline-none focus:border-primary-500 transition text-slate-700"
          />
        </div>
      </div>

      <button
        @click="handleConfirm"
        :disabled="loading"
        class="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200 active:scale-[0.98]"
      >
        {{ loading ? '식단 생성 중...' : '맞춤 식단표 받기' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-up {
  animation: fadeUp 0.3s ease-out forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
