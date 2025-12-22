<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ChallengeResponse } from '@/services/challengeService'
import dayjs from 'dayjs'
import {
  Flame,
  FileText,
  Clock,
  Check,
  Ban,
  Users,
  Calendar,
  Trophy,
  Target
} from 'lucide-vue-next'

const props = defineProps<{
  challenge: ChallengeResponse
  isMyChallenge?: boolean
}>()

const emit = defineEmits<{
  (e: 'join', id: number): void
}>()

const router = useRouter()

// 타입 라벨 및 아이콘 매핑
const typeInfo = computed(() => {
  const map: Record<string, { label: string; icon: any; color: string }> = {
    CALORIE_LIMIT: { label: '칼로리', icon: Flame, color: 'text-rose-500 bg-rose-50' },
    RECORD_FREQUENCY: { label: '습관', icon: FileText, color: 'text-primary-600 bg-primary-50' },
    TIME_RANGE: { label: '타임어택', icon: Clock, color: 'text-amber-500 bg-amber-50' },
  }
  return map[props.challenge.type] || { label: '기타', icon: Trophy, color: 'text-slate-500 bg-slate-50' }
})

// D-Day
const dDay = computed(() => {
  const diff = dayjs(props.challenge.endDate).diff(dayjs(), 'day')
  return diff < 0 ? '종료' : `D-${diff}`
})

// 버튼 상태 계산
const buttonState = computed(() => {
  if (props.challenge.isJoined)
    return { 
      text: '참여 중', 
      icon: Check,
      class: 'bg-emerald-100 text-emerald-700 shadow-none cursor-default', 
      disabled: true 
    }
  if ((props.challenge.currentHeadCount || 0) >= props.challenge.maxParticipants) {
    return { 
      text: '인원 마감', 
      icon: Ban,
      class: 'bg-slate-200 text-slate-500 shadow-none cursor-not-allowed', 
      disabled: true 
    }
  }
  return {
    text: '도전하기',
    icon: Flame,
    class: 'bg-slate-900 text-white hover:bg-black shadow-md shadow-slate-200',
    disabled: false,
  }
})

const goToDetail = () => {
  router.push(`/challenge/${props.challenge.challengeId}`)
}
</script>

<template>
  <div
    @click="goToDetail"
    class="bg-white p-5 rounded-3xl shadow-float border border-slate-100 transition hover:-translate-y-0.5 cursor-pointer relative overflow-hidden group"
  >
    <div class="flex justify-between items-start mb-3">
      <div>
        <div
          class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg mb-2"
          :class="typeInfo.color"
        >
          <component :is="typeInfo.icon" :size="10" stroke-width="3" />
          <span>{{ typeInfo.label }}</span>
        </div>
        <h3 class="font-bold text-slate-800 text-[15px] leading-tight mb-1 group-hover:text-primary-600 transition-colors">{{ challenge.title }}</h3>

        <p v-if="!isMyChallenge" class="text-xs text-slate-500 line-clamp-1">
          {{ challenge.description }}
        </p>

        <p v-else class="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Calendar :size="10" />
          {{ challenge.startDate }} ~ {{ challenge.endDate }}
        </p>
      </div>

      <div
        class="bg-rose-50 text-rose-500 px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap shadow-sm"
      >
        {{ dDay }}
      </div>
    </div>

    <!-- 진행바 (참여중인 경우) -->
    <div v-if="isMyChallenge" class="mt-5">
      <div class="flex justify-between text-xs font-bold mb-1.5">
        <span class="text-primary-600">{{ challenge.progressPercent }}% 달성</span>
        <div class="flex items-center gap-1 text-slate-400 text-[10px]">
            <Target :size="10" />
            <span>{{ challenge.currentCount }} / {{ challenge.goalCount }}회</span>
        </div>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out"
          :style="{ width: `${challenge.progressPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- 정보 및 버튼 (미참여) -->
    <div v-else class="mt-4 pt-3 border-t border-slate-50">
      <div class="flex items-center gap-3 text-[10px] text-slate-400 mb-4 font-medium">
        <div class="flex items-center gap-1">
            <Users :size="12" />
            <span>{{ challenge.currentHeadCount || 0 }}/{{ challenge.maxParticipants || 0 }}명</span>
        </div>
        <div class="flex items-center gap-1">
            <Calendar :size="12" />
            <span>{{ challenge.startDate }} 시작</span>
        </div>
      </div>

      <button
        @click.stop="emit('join', challenge.challengeId)"
        :disabled="buttonState.disabled"
        class="w-full h-10 rounded-xl font-bold text-xs transition active:scale-[0.98] flex items-center justify-center gap-1.5"
        :class="buttonState.class"
      >
        <component :is="buttonState.icon" :size="14" stroke-width="2.5" />
        {{ buttonState.text }}
      </button>
    </div>
  </div>
</template>
