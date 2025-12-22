<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToastStore } from '@/stores/toast'
import type { ChallengeCreateRequest } from '@/services/challengeService'
import {
  X,
  Flame,
  FileText,
  Clock,
  Check,
  Settings,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps<{
  initialData?: ChallengeCreateRequest
  isEditMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: ChallengeCreateRequest): void
}>()

const toastStore = useToastStore()

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

onMounted(() => {
  if (props.initialData) {
    form.value = JSON.parse(JSON.stringify(props.initialData))
  }
})

const typeOptions = [
  { value: 'CALORIE_LIMIT', label: '칼로리 제한', desc: '목표 칼로리 이하 섭취', icon: Flame, color: 'text-rose-500' },
  { value: 'RECORD_FREQUENCY', label: '기록 습관', desc: '하루 N회 이상 기록', icon: FileText, color: 'text-primary-600' },
  { value: 'TIME_RANGE', label: '타임 어택', desc: '아침 식사 마감 시간', icon: Clock, color: 'text-amber-500' },
] as const

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
  if (!form.value.title.trim()) {
    return toastStore.show('제목을 입력해주세요.', 'warning')
  }

  if (!form.value.startDate || !form.value.endDate) {
    return toastStore.show('시작일과 종료일을 모두 설정해주세요.', 'warning')
  }
  if (form.value.startDate > form.value.endDate) {
    return toastStore.show('종료일은 시작일보다 빠를 수 없습니다.', 'warning')
  }

  if (form.value.targetValue < 0) {
    return toastStore.show('목표 수치는 0 이상이어야 합니다.', 'warning')
  }
  if (form.value.goalCount < 1) {
    return toastStore.show('성공 목표일은 최소 1일 이상이어야 합니다.', 'warning')
  }

  emit('submit', { ...form.value })
}
</script>

<template>
  <div
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
  >
    <div
      class="bg-white w-full max-w-[340px] max-h-[80%] rounded-[32px] flex flex-col shadow-float overflow-hidden border border-slate-100"
    >
      <div
        class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10"
      >
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <template v-if="isEditMode">
            <Settings :size="20" class="text-slate-600" />
            <span>챌린지 수정</span>
          </template>
          <template v-else>
            <Sparkles :size="20" class="text-amber-500" />
            <span>챌린지 만들기</span>
          </template>
        </h2>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition">
            <X :size="20" />
        </button>
      </div>

      <div class="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1 bg-slate-50/50">
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
            class="input-field resize-none py-3"
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
              class="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left relative overflow-hidden"
              :class="
                form.type === opt.value
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              "
            >
              <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-sm shrink-0">
                     <component :is="opt.icon" :size="16" :class="opt.color" />
                 </div>
                 <div>
                    <div
                    class="text-xs font-bold"
                    :class="form.type === opt.value ? 'text-primary-700' : 'text-slate-700'"
                    >
                    {{ opt.label }}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">{{ opt.desc }}</div>
                 </div>
              </div>
              <div v-if="form.type === opt.value" class="text-primary-600 bg-white rounded-full p-0.5 shadow-sm">
                  <Check :size="14" stroke-width="3" />
              </div>
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
            <div class="relative">
                <input v-model="form.startDate" type="date" class="input-field text-xs" />
            </div>
            
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

        <div class="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-slate-700">공개 챌린지</span>
            <span class="text-[10px] text-slate-400">누구나 검색하고 참여할 수 있어요</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.isPublic" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"
            ></div>
          </label>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 bg-white pb-6">
        <button
          @click="handleSubmit"
          class="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-sm hover:brightness-110 transition shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Check v-if="isEditMode" :size="18" />
          <Flame v-else :size="18" class="text-orange-500 fill-orange-500" />
          {{ isEditMode ? '수정 완료' : '챌린지 생성하기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  @apply block text-xs font-bold text-slate-500 mb-1.5 ml-1;
}
.input-field {
  @apply w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition text-slate-800 placeholder:text-slate-300;
}
.no-scrollbar::-webkit-scrollbar {
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
