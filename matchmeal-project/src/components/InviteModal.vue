<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChallengeStore } from '@/stores/challenge'
import { useToastStore } from '@/stores/toast'
import {
    X,
    User,
    Mail,
    UserPlus,
    Loader2
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  challengeId: number
}>()

defineEmits<{ (e: 'close'): void }>()

const challengeStore = useChallengeStore()
const toastStore = useToastStore()
const invitingId = ref<number | null>(null)

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      challengeStore.fetchFollowings()
    }
  },
  { immediate: true },
)

const handleInvite = async (userId: number) => {
  invitingId.value = userId
  try {
    await challengeStore.inviteFriend(props.challengeId, userId)
    toastStore.show('초대장을 보냈습니다!', 'success')
  } catch (e) {
    console.log(e)
    toastStore.show('이미 초대했거나 참여 중인 유저입니다.', 'error')
  } finally {
    invitingId.value = null
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
  >
    <div class="bg-white w-full max-w-[320px] rounded-[32px] p-6 shadow-float border border-slate-100 flex flex-col max-h-[80vh]">
      <div class="flex justify-between items-center mb-6 shrink-0">
        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
            <UserPlus :size="20" class="text-primary-500" />
            친구 초대하기
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition">
            <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-2 no-scrollbar">
        <div
          v-if="challengeStore.followings.length === 0"
          class="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2"
        >
          <User :size="32" stroke-width="1.5" />
          팔로우한 친구가 없어요
        </div>

        <div
          v-for="user in challengeStore.followings"
          :key="user.userId"
          class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition hover:bg-white hover:shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              <img
                v-if="user.profileImage"
                :src="user.profileImage"
                class="w-full h-full object-cover"
              />
              <User v-else :size="18" class="text-slate-300" />
            </div>
            <span class="text-sm font-bold text-slate-700 truncate max-w-[100px]">{{ user.userName }}</span>
          </div>

          <button
            @click="handleInvite(user.userId)"
            :disabled="invitingId === user.userId"
            class="px-3 py-1.5 bg-primary-100 text-primary-600 text-xs font-bold rounded-xl hover:bg-primary-200 disabled:opacity-50 transition flex items-center gap-1 min-w-[60px] justify-center"
          >
            <Loader2 v-if="invitingId === user.userId" :size="14" class="animate-spin" />
            <span v-else>초대</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
