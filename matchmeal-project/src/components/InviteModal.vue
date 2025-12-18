<script setup lang="ts">
import { ref, watch } from 'vue' // [수정] watch 추가
import { useChallengeStore } from '@/stores/challenge'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  isOpen: boolean
  challengeId: number
}>()

defineEmits<{ (e: 'close'): void }>()

const challengeStore = useChallengeStore()
const toastStore = useToastStore()
const invitingId = ref<number | null>(null)

// [수정 1] onMounted 대신 watch 사용
// 모달이 열릴 때(isOpen이 true가 될 때)마다 목록을 불러옵니다.
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      challengeStore.fetchFollowings()
    }
  },
  { immediate: true }, // 컴포넌트가 처음부터 열린 상태로 시작될 경우도 대비
)

const handleInvite = async (userId: number) => {
  invitingId.value = userId
  try {
    await challengeStore.inviteFriend(props.challengeId, userId)
    toastStore.show('초대장을 보냈습니다! 💌', 'success')
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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
  >
    <div class="bg-white w-[320px] rounded-2xl p-5 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">친구 초대하기</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div class="max-h-[300px] overflow-y-auto space-y-2 scrollbar-hide">
        <div
          v-if="challengeStore.followings.length === 0"
          class="text-center py-8 text-gray-400 text-xs"
        >
          팔로우한 친구가 없어요 😢
        </div>

        <div
          v-for="user in challengeStore.followings"
          :key="user.userId"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              <img
                v-if="user.profileImage"
                :src="user.profileImage"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-xs">👤</div>
            </div>
            <span class="text-sm font-bold text-gray-700">{{ user.userName }}</span>
          </div>

          <button
            @click="handleInvite(user.userId)"
            :disabled="invitingId === user.userId"
            class="px-3 py-1.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-200 disabled:opacity-50 transition"
          >
            {{ invitingId === user.userId ? '...' : '초대' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
