<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChallengeStore } from '@/stores/challenge'
import { useToastStore } from '@/stores/toast'
import { useConfirmStore } from '@/stores/confirm'
import type { ChallengeCreateRequest } from '@/services/challengeService'
import { 
  ArrowLeft, 
  Lock, 
  Mail, 
  Search, 
  Plus, 
  Flame, 
  Clock, 
  Calendar 
} from 'lucide-vue-next'

const router = useRouter()

// 컴포넌트 임포트
import BottomNav from '@/components/common/BottomNav.vue'
import PrivateCodeModal from '@/components/PrivateCodeModal.vue'
import ChallengeCreateForm from '@/components/ChallengeCreateForm.vue'
import ChallengeCard from '@/components/ChallengeCard.vue'
import InviteCheckModal from '@/components/InviteCheckModal.vue'

const challengeStore = useChallengeStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()

// 탭 및 필터 상태
const activeTab = ref<'my' | 'explore'>('my')
const searchKeyword = ref('')
const selectedType = ref('')
const hideJoined = ref(false)

// 모달 상태
const showCreateModal = ref(false)
const showCodeModal = ref(false)
const showInviteCheckModal = ref(false)

// 초기 데이터 로드
onMounted(async () => {
  await Promise.all([
    challengeStore.fetchMyChallenges().then(() => {
      if (challengeStore.updateAllMyChallengesProgress) {
        challengeStore.updateAllMyChallengesProgress()
      }
    }),
    challengeStore.fetchPublicChallenges(),
    challengeStore.fetchMyInvitations(),
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
  { value: 'CALORIE_LIMIT', label: '칼로리', icon: Flame },
  { value: 'RECORD_FREQUENCY', label: '습관', icon: Calendar },
  { value: 'TIME_RANGE', label: '시간', icon: Clock },
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
    toastStore.show('챌린지를 생성했습니다.', 'success')
    showCreateModal.value = false
    activeTab.value = 'my'
  } catch (e) {
    console.error(e)
    toastStore.show('생성에 실패했습니다.', 'error')
  }
}

// 참여
const handleJoin = async (id: number) => {
  if (!(await confirmStore.show('정말 참여하시겠습니까?'))) return
  try {
    await challengeStore.joinChallenge(id)
    toastStore.show('참여 완료! 파이팅입니다.', 'success')
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
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <!-- Header -->
      <header class="relative bg-white border-b border-slate-100 h-14 flex items-center px-4 sticky top-0 z-20 shrink-0 justify-between">
        <div class="z-10 relative">
          <button v-if="activeTab === 'my'" @click="router.push('/home')" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
          </button>
        </div>

        <h1 class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-lg text-slate-800">
          챌린지
        </h1>

        <div class="flex gap-2 z-10 relative">
          <button @click="showCodeModal = true" class="relative p-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <Lock :size="20" />
          </button>
          <button @click="showInviteCheckModal = true" class="relative p-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <Mail :size="20" />
            <span
              v-if="challengeStore.myInvitations.length > 0"
              class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"
            ></span>
          </button>
        </div>
      </header>

      <!-- Tabs & Search (Sticky below header) -->
      <div class="bg-white z-10 border-b border-slate-100">
        <div class="flex p-2">
          <button
            @click="activeTab = 'my'"
            class="flex-1 py-2.5 text-sm font-bold border-b-2 transition"
            :class="
              activeTab === 'my'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            "
          >
            내 도전
          </button>
          <button
            @click="activeTab = 'explore'"
            class="flex-1 py-2.5 text-sm font-bold border-b-2 transition"
            :class="
              activeTab === 'explore'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            "
          >
            탐색하기
          </button>
        </div>

        <div v-if="activeTab === 'explore'" class="space-y-3 pb-3 px-4 animate-fade-in">
          <div class="relative mt-2">
            <input
              v-model="searchKeyword"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="관심있는 챌린지 검색..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white transition"
            />
            <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div class="flex justify-between items-center">
            <div class="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
              <button
                v-for="t in challengeTypes"
                :key="t.value"
                @click="selectType(t.value)"
                class="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition whitespace-nowrap flex items-center gap-1"
                :class="
                  selectedType === t.value
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                "
              >
                <component v-if="t.icon" :is="t.icon" :size="12" />
                {{ t.label }}
              </button>
            </div>
            <label class="flex items-center gap-1.5 cursor-pointer pl-2">
              <input
                type="checkbox"
                v-model="hideJoined"
                class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span class="text-xs text-slate-500 font-medium whitespace-nowrap">미참여만</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-hide bg-slate-50 p-5 space-y-4">
        <div v-if="challengeStore.isLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <template v-if="activeTab === 'my' && !challengeStore.isLoading">
          <div v-if="challengeStore.myChallenges.length === 0" class="empty-state flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Flame :size="32" />
            </div>
            <p class="text-slate-500 font-medium text-sm">참여 중인 챌린지가 없어요</p>
            <p class="text-slate-400 text-xs mt-1">새로운 목표에 도전해보세요!</p>
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
        class="absolute bottom-24 right-6 w-14 h-14 bg-accent text-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center z-30 hover:brightness-105 hover:scale-105 transition-all duration-300 active:scale-95 group"
      >
        <Plus :size="28" stroke-width="2.5" class="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <InviteCheckModal
        :is-open="showInviteCheckModal"
        :invitations="challengeStore.myInvitations"
        @close="showInviteCheckModal = false"
        @updated="challengeStore.fetchMyInvitations"
      />
    </div>
</template>

<style scoped>
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
