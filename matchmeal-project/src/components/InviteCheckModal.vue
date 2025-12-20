<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useToastStore } from '@/stores/toast'
import { acceptInvitation, rejectInvitation } from '@/services/challengeService'
import type { ChallengeInvitationResponse } from '@/services/challengeService'

defineProps<{
  isOpen: boolean
  invitations: ChallengeInvitationResponse[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void // 처리가 일어나면 부모에게 알림 (목록 갱신용)
}>()

const router = useRouter()
const toastStore = useToastStore()
// const challengeStore = useChallengeStore()
const isProcessing = ref(false)

const handleAccept = async (invitation: ChallengeInvitationResponse) => {
  if (isProcessing.value) return
  isProcessing.value = true
  try {
    await acceptInvitation(invitation.invitationId)
    toastStore.show(`'${invitation.challengeTitle}' 챌린지에 참여했습니다!`, 'success')
    emit('updated')

    // 수락 후 챌린지 상세로 이동 및 모달 닫기
    emit('close')
    router.push(`/challenge/${invitation.challengeId}`)
  } catch (error) {
    console.error(error)
    toastStore.show('참여 처리에 실패했습니다.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const handleReject = async (invitationId: number) => {
  if (isProcessing.value) return
  isProcessing.value = true
  try {
    await rejectInvitation(invitationId)
    toastStore.show('초대를 거절했습니다.', 'info')
    emit('updated')
  } catch (error) {
    console.error(error)
    toastStore.show('거절 처리에 실패했습니다.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const close = () => emit('close')
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 transition-opacity" @click="close"></div>
    <div
      class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-pop-in z-10"
    >
      <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h3 class="text-lg font-bold text-gray-800">받은 초대 💌</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="invitations.length === 0" class="text-center py-10 text-gray-400 text-sm">
          새로운 초대가 없습니다.
        </div>

        <div
          v-for="inv in invitations"
          :key="inv.invitationId"
          class="bg-white border rounded-2xl p-4 shadow-sm"
        >
          <!-- 보낸 사람 -->
          <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <img
              v-if="inv.inviterProfileImage"
              :src="inv.inviterProfileImage"
              class="w-6 h-6 rounded-full object-cover"
            />
            <div
              v-else
              class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs"
            >
              👤
            </div>
            <span
              class="text-xs text-gray-600 font-bold"
              :class="{ 'text-gray-400': !inv.inviterName }"
            >
              {{ inv.inviterName || '알 수 없는 사용자' }}님의 초대
            </span>
            <span class="text-[10px] text-gray-400 ml-auto">{{ inv.sentAt?.split('T')[0] }}</span>
          </div>

          <!-- 챌린지 정보 요약 -->
          <div class="mb-4">
            <h4 class="font-bold text-gray-800 text-base mb-1">{{ inv.challengeTitle }}</h4>
            <div class="flex gap-2 text-xs text-gray-500">
              <span
                class="bg-gray-100 px-2 py-0.5 rounded text-[10px]"
                v-if="inv.type === 'CALORIE_LIMIT'"
                >칼로리</span
              >
              <span
                class="bg-gray-100 px-2 py-0.5 rounded text-[10px]"
                v-else-if="inv.type === 'RECORD_FREQUENCY'"
                >기록</span
              >
              <span class="bg-gray-100 px-2 py-0.5 rounded text-[10px]" v-else>시간</span>

              <span>목표: {{ inv.goalCount }}회</span>
              <span>멤버: {{ inv.currentHeadCount }}/{{ inv.maxParticipants }}</span>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex gap-2">
            <button
              @click="handleReject(inv.invitationId)"
              :disabled="isProcessing"
              class="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              거절
            </button>
            <button
              @click="handleAccept(inv)"
              :disabled="isProcessing"
              class="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
            >
              수락하고 참여
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-pop-in {
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
