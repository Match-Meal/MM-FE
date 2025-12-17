<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChallengeCreateRequest } from '@/services/challengeService'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: ChallengeCreateRequest): void
}>()

// 폼 초기 상태
const form = ref<ChallengeCreateRequest>({
  title: '',
  description: '',
  type: 'CALORIE_LIMIT',
  targetValue: 0,
  startDate: '',
  endDate: '',
  goalCount: 1,
  maxParticipants: 10,
  isPublic: true,
})

// 챌린지 타입 정의
const typeOptions = [
  { value: 'CALORIE_LIMIT', label: '🔥 칼로리 제한', desc: '목표 칼로리 이하로 섭취하기' },
  { value: 'RECORD_FREQUENCY', label: '📝 기록 습관', desc: '하루 N회 이상 식단 기록하기' },
  { value: 'TIME_RANGE', label: '⏰ 타임 어택', desc: '지정 시간(시) 이전에 아침 먹기' },
] as const

// 타입에 따른 라벨 동적 변경
const targetLabel = computed(() => {
  switch (form.value.type) {
    case 'CALORIE_LIMIT':
      return '목표 칼로리 (kcal)'
    case 'RECORD_FREQUENCY':
      return '하루 기록 횟수 (회)'
    case 'TIME_RANGE':
      return '아침 식사 마감 시간 (0~23시)'
    default:
      return '목표 수치'
  }
})

const handleSubmit = () => {
  // 유효성 검사
  if (!form.value.title.trim()) return alert('제목을 입력해주세요.')
  if (!form.value.startDate || !form.value.endDate) return alert('기간을 설정해주세요.')
  if (form.value.targetValue < 0) return alert('목표 수치는 양수여야 합니다.')

  if (form.value.startDate > form.value.endDate) {
    return alert('종료일은 시작일보다 빠를 수 없습니다.')
  }

  emit('submit', { ...form.value })
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
  >
    <div
      class="bg-white w-[340px] max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10"
      >
        <h2 class="text-lg font-bold text-gray-800">✨ 챌린지 만들기</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div class="p-6 space-y-5 overflow-y-auto scrollbar-hide flex-1">
        <div>
          <label class="label">챌린지 제목</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="예: 3대 500 가보자고"
            class="input-field"
          />
        </div>

        <div>
          <label class="label">설명</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="어떤 챌린지인가요?"
            class="input-field resize-none"
          ></textarea>
        </div>

        <div>
          <label class="label">도전 유형</label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              type="button"
              @click="form.type = opt.value"
              class="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
              :class="
                form.type === opt.value
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              "
            >
              <div>
                <div
                  class="text-xs font-bold"
                  :class="form.type === opt.value ? 'text-blue-700' : 'text-gray-700'"
                >
                  {{ opt.label }}
                </div>
                <div class="text-[10px] text-gray-500 mt-0.5">{{ opt.desc }}</div>
              </div>
              <div v-if="form.type === opt.value" class="text-blue-600 text-lg">✔</div>
            </button>
          </div>
        </div>

        <div>
          <label class="label">{{ targetLabel }}</label>
          <input v-model.number="form.targetValue" type="number" class="input-field font-mono" />
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <label class="label">시작일</label>
            <input v-model="form.startDate" type="date" class="input-field text-xs" />
          </div>
          <div class="flex-1">
            <label class="label">종료일</label>
            <input v-model="form.endDate" type="date" class="input-field text-xs" />
          </div>
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <label class="label">성공 목표(일)</label>
            <input v-model.number="form.goalCount" type="number" min="1" class="input-field" />
          </div>
          <div class="flex-1">
            <label class="label">최대 인원</label>
            <input
              v-model.number="form.maxParticipants"
              type="number"
              min="1"
              max="100"
              class="input-field"
            />
          </div>
        </div>

        <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-700">공개 챌린지</span>
            <span class="text-[10px] text-gray-500">누구나 검색하고 참여할 수 있어요</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.isPublic" class="sr-only peer" />
            <div
              class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"
            ></div>
          </label>
        </div>
      </div>

      <div class="p-4 border-t border-gray-100 bg-white">
        <button
          @click="handleSubmit"
          class="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition shadow-lg active:scale-[0.98]"
        >
          챌린지 생성하기 🔥
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply block text-xs font-bold text-gray-500 mb-1.5 ml-1;
}
.input-field {
  @apply w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:bg-white focus:border-blue-500 outline-none transition;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
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
