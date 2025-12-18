<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChallengeStore } from '@/stores/challenge'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { ChallengeCreateRequest } from '@/services/challengeService'

import ChallengeCreateForm from '@/components/ChallengeCreateForm.vue'
import InviteModal from '@/components/InviteModal.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const challengeId = Number(route.params.id)

// 모달 상태
const showEditModal = ref(false)
const showInviteModal = ref(false)

onMounted(async () => {
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }

  await challengeStore.fetchChallengeDetail(challengeId)
})

const challenge = computed(() => challengeStore.currentChallenge)

// 방장 여부 확인 (내 ID와 챌린지 Owner ID 비교)
const isOwner = computed(() => {
  // challenge가 로드되지 않았거나 user 정보가 없으면 false
  if (!challenge.value || !authStore.user) return false
  return challenge.value.ownerId === authStore.user.id
})

// D-Day 계산
const dDay = computed(() => {
  if (!challenge.value) return ''
  const diff = dayjs(challenge.value.endDate).diff(dayjs(), 'day')
  return diff < 0 ? '종료' : `D-${diff}`
})

// 수정 핸들러
const handleUpdate = async (payload: ChallengeCreateRequest) => {
  try {
    await challengeStore.modifyChallenge(challengeId, payload)

    toastStore.show('챌린지가 수정되었습니다.', 'success')
    showEditModal.value = false
  } catch (e) {
    console.error(e)
    toastStore.show('수정에 실패했습니다.', 'error')
  }
}

// 수정용 초기 데이터 매핑 (API 응답 -> 폼 형식)
const editInitialData = computed((): ChallengeCreateRequest | undefined => {
  if (!challenge.value) return undefined
  return {
    title: challenge.value.title,
    description: challenge.value.description,
    type: challenge.value.type,
    targetValue: challenge.value.targetValue,
    startDate: challenge.value.startDate,
    endDate: challenge.value.endDate,
    goalCount: challenge.value.goalCount,
    maxParticipants: challenge.value.maxParticipants,
    isPublic: challenge.value.isPublic,
  }
})
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-900 flex flex-col"
    >
      <div
        v-if="challengeStore.isLoading || !challenge"
        class="flex-1 flex items-center justify-center"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <template v-else>
        <div class="absolute top-0 left-0 right-0 p-5 pt-6 flex justify-between items-center z-10">
          <button
            @click="router.back()"
            class="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition"
          >
            ←
          </button>
          <div class="flex gap-2">
            <button
              v-if="isOwner"
              @click="showEditModal = true"
              class="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full shadow-lg hover:bg-black transition"
            >
              설정 ⚙️
            </button>
            <button
              @click="showInviteModal = true"
              class="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg hover:bg-blue-700 transition"
            >
              초대 💌
            </button>
          </div>
        </div>

        <div
          class="h-[240px] flex flex-col justify-end p-6 text-white relative overflow-hidden"
          :class="{
            'bg-gradient-to-br from-orange-400 to-red-500': challenge.type === 'CALORIE_LIMIT',
            'bg-gradient-to-br from-blue-400 to-indigo-500': challenge.type === 'RECORD_FREQUENCY',
            'bg-gradient-to-br from-green-400 to-teal-500': challenge.type === 'TIME_RANGE',
          }"
        >
          <div class="relative z-10 animate-slide-up">
            <span
              class="inline-block px-2 py-1 bg-white/20 backdrop-blur rounded text-[10px] font-bold mb-2"
            >
              {{ dDay }}
            </span>
            <h1 class="text-2xl font-black leading-tight mb-1">{{ challenge.title }}</h1>
            <p class="text-white/80 text-xs">{{ challenge.startDate }} ~ {{ challenge.endDate }}</p>
          </div>
        </div>

        <div
          class="flex-1 bg-white -mt-6 rounded-t-[30px] relative z-0 p-6 overflow-y-auto scrollbar-hide space-y-6 animate-slide-up-delayed"
        >
          <div class="text-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <div class="text-xs text-gray-500 font-bold mb-1">현재 달성률</div>
            <div class="text-3xl font-black text-blue-600 mb-3">
              {{ challenge.progressPercent }}%
            </div>
            <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all duration-1000"
                :style="{ width: `${challenge.progressPercent}%` }"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-gray-400 font-bold">
              <span>0%</span>
              <span>성공 {{ challenge.currentCount }} / {{ challenge.goalCount }}회</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-800 mb-2">챌린지 소개</h3>
            <p class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl min-h-[80px]">
              {{ challenge.description || '설명이 없습니다.' }}
            </p>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-800 mb-2">
              참여 멤버 ({{ challenge.currentHeadCount || 0 }}/{{ challenge.maxParticipants }})
            </h3>
            <div class="flex -space-x-2 overflow-hidden py-1">
              <div
                v-for="i in Math.min(challenge.currentHeadCount || 0, 5)"
                :key="i"
                class="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px]"
              >
                👤
              </div>

              <div
                v-if="(challenge.currentHeadCount || 0) > 5"
                class="w-8 h-8 rounded-full bg-gray-800 text-white border-2 border-white flex items-center justify-center text-[10px] z-10"
              >
                +{{ (challenge.currentHeadCount || 0) - 5 }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <ChallengeCreateForm
        v-if="showEditModal"
        :initial-data="editInitialData"
        :is-edit-mode="true"
        @close="showEditModal = false"
        @submit="handleUpdate"
      />

      <InviteModal
        :is-open="showInviteModal"
        :challenge-id="challengeId"
        @close="showInviteModal = false"
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}
.animate-slide-up-delayed {
  animation: slideUp 0.5s ease-out 0.1s backwards;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
