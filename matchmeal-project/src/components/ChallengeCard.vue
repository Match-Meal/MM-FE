<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ChallengeResponse } from '@/services/challengeService'
import dayjs from 'dayjs'

const props = defineProps<{
  challenge: ChallengeResponse
  isMyChallenge?: boolean // '내 챌린지' 탭인지 여부
}>()

const emit = defineEmits<{
  (e: 'join', id: number): void
}>()

const router = useRouter() // [추가] 라우터 인스턴스

// 타입 라벨
const typeLabel = computed(() => {
  const map: Record<string, string> = {
    CALORIE_LIMIT: '🔥 칼로리',
    RECORD_FREQUENCY: '📝 습관',
    TIME_RANGE: '⏰ 타임어택',
  }
  return map[props.challenge.type] || '기타'
})

// D-Day
const dDay = computed(() => {
  const diff = dayjs(props.challenge.endDate).diff(dayjs(), 'day')
  return diff < 0 ? '종료' : `D-${diff}`
})

// 버튼 상태 계산
const buttonState = computed(() => {
  if (props.challenge.isJoined)
    return { text: '참여 중 ✅', class: 'bg-green-100 text-green-700', disabled: true }
  if ((props.challenge.currentHeadCount || 0) >= props.challenge.maxParticipants) {
    return { text: '인원 마감 🚫', class: 'bg-gray-200 text-gray-500', disabled: true }
  }
  return {
    text: '도전하기 🔥',
    class: 'bg-gray-900 text-white hover:bg-black shadow-md',
    disabled: false,
  }
})

// 상세 페이지 이동 함수
const goToDetail = () => {
  router.push(`/challenge/${props.challenge.challengeId}`)
}
</script>

<template>
  <div
    @click="goToDetail"
    class="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition hover:-translate-y-0.5 cursor-pointer"
  >
    <div class="flex justify-between items-start mb-2">
      <div>
        <span
          class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1.5 inline-block"
        >
          {{ typeLabel }}
        </span>
        <h3 class="font-bold text-gray-800 text-[15px] leading-tight">{{ challenge.title }}</h3>

        <p v-if="!isMyChallenge" class="text-xs text-gray-500 mt-1 line-clamp-1">
          {{ challenge.description }}
        </p>

        <p v-else class="text-[10px] text-gray-400 mt-1">
          {{ challenge.startDate }} ~ {{ challenge.endDate }}
        </p>
      </div>

      <div
        class="bg-red-50 text-red-500 px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap"
      >
        {{ dDay }}
      </div>
    </div>

    <div v-if="isMyChallenge" class="mt-4">
      <div class="flex justify-between text-xs font-bold mb-1.5">
        <span class="text-blue-600">{{ challenge.progressPercent }}% 달성</span>
        <span class="text-gray-400"
          >{{ challenge.currentCount }} / {{ challenge.goalCount }}회</span
        >
      </div>
      <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-500 rounded-full transition-all duration-700"
          :style="{ width: `${challenge.progressPercent}%` }"
        ></div>
      </div>
    </div>

    <div v-else class="mt-3">
      <div class="flex items-center gap-2 text-[10px] text-gray-400 mb-3 font-medium">
        <span>👥 {{ challenge.currentHeadCount || 0 }}/{{ challenge.maxParticipants || 0 }}명</span>
        <span>📅 {{ challenge.startDate }} 시작</span>
      </div>

      <button
        @click.stop="emit('join', challenge.challengeId)"
        :disabled="buttonState.disabled"
        class="w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-95"
        :class="buttonState.class"
      >
        {{ buttonState.text }}
      </button>
    </div>
  </div>
</template>
