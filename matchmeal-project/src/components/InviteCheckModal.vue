<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useToastStore } from '@/stores/toast'
import { acceptInvitation, rejectInvitation } from '@/services/challengeService'
import type { ChallengeInvitationResponse } from '@/services/challengeService'
import {
    X,
    User,
    Mail,
    Flame,
    FileText,
    Clock
} from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  invitations: ChallengeInvitationResponse[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const router = useRouter()
const toastStore = useToastStore()
const isProcessing = ref(false)

const handleAccept = async (invitation: ChallengeInvitationResponse) => {
  if (isProcessing.value) return
  isProcessing.value = true
  try {
    await acceptInvitation(invitation.invitationId)
    toastStore.show(`'${invitation.challengeTitle}' 챌린지에 참여했습니다!`, 'success')
    emit('updated')

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
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="close"></div>
    <div
      class="relative bg-white rounded-[32px] shadow-float w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-pop-in z-10"
    >
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mail :size="20" class="text-primary-500" />
            받은 초대
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition">
            <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-50">
        <div v-if="invitations.length === 0" class="text-center py-10 text-slate-400 text-sm">
          새로운 초대가 없습니다.
        </div>

        <div
          v-for="inv in invitations"
          :key="inv.invitationId"
          class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
        >
          <!-- 보낸 사람 -->
          <div class="flex items-center gap-2 mb-3 pb-3 border-b border-slate-50">
            <img
              v-if="inv.inviterProfileImage"
              :src="inv.inviterProfileImage"
              class="w-6 h-6 rounded-full object-cover"
            />
            <div
              v-else
              class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300"
            >
              <User :size="14" />
            </div>
            <span
              class="text-xs text-slate-600 font-bold"
              :class="{ 'text-slate-400': !inv.inviterName }"
            >
              {{ inv.inviterName || '알 수 없는 사용자' }}님의 초대
            </span>
            <span class="text-[10px] text-slate-400 ml-auto">{{ inv.sentAt?.split('T')[0] }}</span>
          </div>

          <!-- 챌린지 정보 요약 -->
          <div class="mb-5">
            <h4 class="font-bold text-slate-800 text-base mb-2">{{ inv.challengeTitle }}</h4>
            <div class="flex flex-wrap gap-2 text-xs text-slate-500">
              <span
                class="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"
                v-if="inv.type === 'CALORIE_LIMIT'"
              >
                <Flame :size="10" /> 칼로리
              </span>
              <span
                class="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"
                v-else-if="inv.type === 'RECORD_FREQUENCY'"
              >
                <FileText :size="10" /> 기록
              </span>
              <span class="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1" v-else>
                <Clock :size="10" /> 시간
              </span>

              <span class="bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">목표: {{ inv.goalCount }}회</span>
              <span class="bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">멤버: {{ inv.currentHeadCount }}/{{ inv.maxParticipants }}</span>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex gap-2">
            <button
              @click="handleReject(inv.invitationId)"
              :disabled="isProcessing"
              class="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition active:scale-[0.98]"
            >
              거절
            </button>
            <button
              @click="handleAccept(inv)"
              :disabled="isProcessing"
              class="flex-1 py-2.5 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition shadow-md shadow-primary-200 active:scale-[0.98]"
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
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
