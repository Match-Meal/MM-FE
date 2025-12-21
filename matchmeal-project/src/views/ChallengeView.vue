<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChallengeStore } from '@/stores/challenge'
import { useToastStore } from '@/stores/toast'
import type { ChallengeCreateRequest } from '@/services/challengeService'

const router = useRouter()

// 컴포넌트 임포트
import BottomNav from '@/components/common/BottomNav.vue'
import PrivateCodeModal from '@/components/PrivateCodeModal.vue'
import ChallengeCreateForm from '@/components/ChallengeCreateForm.vue'
import ChallengeCard from '@/components/ChallengeCard.vue'
import InviteCheckModal from '@/components/InviteCheckModal.vue' // Added

const challengeStore = useChallengeStore()
const toastStore = useToastStore()

// 탭 및 필터 상태
const activeTab = ref<'my' | 'explore'>('my')
const searchKeyword = ref('')
const selectedType = ref('')
const hideJoined = ref(false)

// 모달 상태
const showCreateModal = ref(false)
const showCodeModal = ref(false)
const showInviteCheckModal = ref(false) // Added

// 초기 데이터 로드
onMounted(async () => {
  await Promise.all([
    challengeStore.fetchMyChallenges(),
    challengeStore.fetchPublicChallenges(),
    challengeStore.fetchMyInvitations(), // Added
  ])
})

// --- [Computed] ---
const filteredChallenges = computed(() => {
  let list = challengeStore.publicChallenges
  if (hideJoined.value) {
    list = list.filter((c) => !c.isJoined)
  }
  return list
})

const challengeTypes = [
  { value: '', label: '전체' },
  { value: 'CALORIE_LIMIT', label: '칼로리' },
  { value: 'RECORD_FREQUENCY', label: '습관' },
  { value: 'TIME_RANGE', label: '시간' },
]

// --- [Actions] ---
const handleSearch = () => {
  challengeStore.fetchPublicChallenges({
    keyword: searchKeyword.value,
    type: selectedType.value,
  })
}

const selectType = (type: string) => {
  selectedType.value = type
  handleSearch()
}

// 생성
const handleCreateSubmit = async (payload: ChallengeCreateRequest) => {
  try {
    await challengeStore.createChallenge(payload)
    toastStore.show('챌린지를 생성했습니다! 🎉', 'success')
    showCreateModal.value = false
    activeTab.value = 'my'
  } catch (e) {
    console.error(e)
    toastStore.show('생성에 실패했습니다.', 'error')
  }
}

// 참여
const handleJoin = async (id: number) => {
  if (!confirm('정말 참여하시겠습니까?')) return
  try {
    await challengeStore.joinChallenge(id)
    toastStore.show('참여 완료! 파이팅입니다 🔥', 'success')
    activeTab.value = 'my'
  } catch (e) {
    console.error(e)
    toastStore.show('참여 실패 (인원 초과 등)', 'error')
  }
}

// 코드 참여
const handleCodeSubmit = async (code: string) => {
  try {
    await challengeStore.joinPrivateChallenge(code)
    toastStore.show('비공개 챌린지 입장 성공!', 'success')
    showCodeModal.value = false
    activeTab.value = 'my'
  } catch (e) {
    console.error(e)
    toastStore.show('코드가 올바르지 않습니다.', 'error')
  }
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-900 flex flex-col"
    >
      <!-- Header -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <button v-if="activeTab === 'my'" @click="router.push('/home')" class="text-2xl w-8">
          ←
        </button>
        <div v-else class="w-8"></div>
        <h1 class="font-bold text-lg truncate">챌린지</h1>
        <div class="flex gap-3 text-lg">
          <button @click="showCodeModal = true" class="relative">🔒</button>
          <button @click="showInviteCheckModal = true" class="relative">
            💌
            <span
              v-if="challengeStore.myInvitations.length > 0"
              class="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white"
            >
              {{ challengeStore.myInvitations.length }}
            </span>
          </button>
        </div>
      </header>

      <!-- Tabs & Search (Sticky below header) -->
      <div class="bg-white z-10 border-b border-gray-100">
        <div class="flex p-2">
          <button
            @click="activeTab = 'my'"
            class="flex-1 py-2 text-sm font-bold border-b-2 transition"
            :class="
              activeTab === 'my'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            "
          >
            내 도전
          </button>
          <button
            @click="activeTab = 'explore'"
            class="flex-1 py-2 text-sm font-bold border-b-2 transition"
            :class="
              activeTab === 'explore'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            "
          >
            탐색하기
          </button>
        </div>

        <div v-if="activeTab === 'explore'" class="space-y-3 pb-2 animate-fade-in">
          <div class="relative">
            <input
              v-model="searchKeyword"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="관심있는 챌린지 검색..."
              class="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 transition"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                v-for="t in challengeTypes"
                :key="t.value"
                @click="selectType(t.value)"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition whitespace-nowrap"
                :class="
                  selectedType === t.value
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200'
                "
              >
                {{ t.label }}
              </button>
            </div>
            <label class="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                v-model="hideJoined"
                class="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span class="text-[10px] text-gray-500 font-bold whitespace-nowrap">미참여만</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-hide bg-gray-50/50 p-5 space-y-4">
        <div v-if="challengeStore.isLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <template v-if="activeTab === 'my' && !challengeStore.isLoading">
          <div v-if="challengeStore.myChallenges.length === 0" class="empty-state">
            참여 중인 챌린지가 없어요 😢<br />새로운 목표에 도전해보세요!
          </div>
          <ChallengeCard
            v-for="item in challengeStore.myChallenges"
            :key="item.challengeId"
            :challenge="item"
            :is-my-challenge="true"
          />
        </template>

        <template v-if="activeTab === 'explore' && !challengeStore.isLoading">
          <ChallengeCard
            v-for="item in filteredChallenges"
            :key="item.challengeId"
            :challenge="item"
            :is-my-challenge="false"
            @join="handleJoin"
          />
        </template>
      </div>

      <BottomNav />

      <ChallengeCreateForm
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @submit="handleCreateSubmit"
      />

      <PrivateCodeModal
        :is-open="showCodeModal"
        @close="showCodeModal = false"
        @submit="handleCodeSubmit"
      />

      <button
        @click="showCreateModal = true"
        class="absolute bottom-24 right-5 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl text-3xl flex items-center justify-center z-30 hover:bg-blue-700 transition active:scale-95"
      >
        ➕
      </button>

      <InviteCheckModal
        :is-open="showInviteCheckModal"
        :invitations="challengeStore.myInvitations"
        @close="showInviteCheckModal = false"
        @updated="challengeStore.fetchMyInvitations"
      />
    </div>
  </div>
</template>

<style scoped>
.icon-btn {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm transition hover:scale-110 active:scale-95;
}
.tab-btn {
  @apply flex-1 py-2 text-xs font-bold rounded-lg text-gray-400 transition;
}
.tab-btn.active {
  @apply bg-white text-gray-800 shadow-sm;
}
.empty-state {
  @apply text-center py-20 text-xs text-gray-400 leading-relaxed;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
