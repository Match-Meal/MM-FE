<script setup lang="ts">
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChallengeStore } from '@/stores/challenge'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { ChallengeCreateRequest } from '@/services/challengeService'

import ChallengeCreateForm from '@/components/ChallengeCreateForm.vue'
import InviteModal from '@/components/InviteModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue' // Added
import dayjs from 'dayjs'
import DietListModal from '@/components/DietListModal.vue'
import {
  deleteChallenge,
  leaveChallenge,
  joinChallenge,
  type ChallengeParticipantDto,
} from '@/services/challengeService'
import {
  getDietListByPeriod,
  getDietDetail,
  type DailyDietResponseItem,
  type DietDetailItem,
} from '@/services/dietService'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const challengeId = Number(route.params.id)

const challenge = computed(() => challengeStore.currentChallenge)

// 모달 상태
const showEditModal = ref(false)
const showInviteModal = ref(false)
const showUserModal = ref(false)
const selectedUser = ref<ChallengeParticipantDto | null>(null)
const isMenuOpen = ref(false) // Added for header menu

// 챌린지 식단 기록 관련
const isDietListModalOpen = ref(false)
const challengeDiets = ref<DailyDietResponseItem[]>([])

// 유저 모달 데이터 매핑
const openUserModal = (participant: ChallengeParticipantDto) => {
  selectedUser.value = {
    userId: participant.userId,
    userName: participant.userName,
    profileImage: participant.profileImage || undefined,
    progressPercent: participant.progressPercent,
  }
  showUserModal.value = true
}

// 챌린지 기록 조회
const openChallengeLog = async () => {
  if (!challenge.value || !selectedUser.value) return

  // 모달 교체
  showUserModal.value = false

  try {
    const list = await getDietListByPeriod(
      challenge.value.startDate,
      challenge.value.endDate,
      selectedUser.value.userId,
    )
    // 리스트가 null일 경우 대비
    console.log('Diet List from Period API:', list)

    // API 응답 필드 불일치 가능성 처리 (details vs dietDetails)
    let mappedList =
      list?.map((item: DailyDietResponseItem & { dietDetails?: DietDetailItem[] }) => ({
        ...item,
        details: item.details || item.dietDetails || [],
      })) || []

    // details가 비어있다면, 상세 조회를 통해 채워넣기 시도 (임시 워크어라운드)
    // 주의: 기간이 길면 요청이 많아질 수 있음
    if (mappedList.length > 0 && mappedList.some((d) => d.details.length === 0 && d.memo === '')) {
      try {
        const detailPromises = mappedList.map(async (diet) => {
          // 이미 details가 있으면 스킵
          if (diet.details && diet.details.length > 0) return diet

          // 상세 조회 API 호출 (getDietDetail은 { data: item } 형태 반환 가정)
          // dietService.ts에 getDietDetail(dietId)가 있음
          const detailRes = await getDietDetail(diet.dietId)
          return detailRes.data
        })

        const detailedResults = await Promise.all(detailPromises)
        mappedList = detailedResults
      } catch (err) {
        console.warn('Failed to fetch individual diet details', err)
        // 실패해도 기존 리스트라도 보여줌
      }
    }

    challengeDiets.value = mappedList
    isDietListModalOpen.value = true
  } catch (e) {
    console.error('Failed to fetch diet logs', e)
    toastStore.show('식단 기록을 불러오는데 실패했습니다.', 'error')
  }
}

const handleDietModalClose = () => {
  isDietListModalOpen.value = false
}

// [Added] 프론트엔드 진행률 재계산 로직
// [Modified] 로컬 계산 로직 제거 -> Store의 updateChallengeProgress 사용
// const realProgressPercent = ref(0)
// const realSuccessCount = ref(0)

// const fetchAndCalculateProgress = ... (removed)

const handleEditClick = () => {
  showEditModal.value = true
  isMenuOpen.value = false
}

const handleDeleteClick = () => {
  handleDelete()
  isMenuOpen.value = false
}

const handleLeaveClick = () => {
  handleLeave()
  isMenuOpen.value = false
}

onMounted(async () => {
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }

  await challengeStore.fetchChallengeDetail(challengeId)
  if (challenge.value?.isJoined) {
    await challengeStore.updateChallengeProgress(challengeId)
  }
})

onActivated(async () => {
  await challengeStore.fetchChallengeDetail(challengeId)
  if (challenge.value?.isJoined) {
    await challengeStore.updateChallengeProgress(challengeId)
  }
})

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

// 삭제 핸들러
const handleDelete = async () => {
  if (!confirm('정말 챌린지를 삭제하시겠습니까? 모든 데이터가 사라집니다.')) return

  try {
    await deleteChallenge(challengeId)
    toastStore.show('챌린지가 삭제되었습니다.', 'info')
    router.replace('/challenge')
  } catch (e) {
    console.error(e)
    toastStore.show('삭제에 실패했습니다.', 'error')
  }
}

// 나가기 핸들러
const handleLeave = async () => {
  if (!confirm('챌린지를 그만두시겠습니까? 현재까지의 기록은 유지되지 않을 수 있습니다.')) return

  try {
    await leaveChallenge(challengeId)
    toastStore.show('챌린지에서 나갔습니다.', 'info')
    router.replace('/challenge')
  } catch (e) {
    console.error(e)
    toastStore.show('나가기 실패 (오류 발생)', 'error')
  }
}

// 참여 핸들러
const handleJoin = async () => {
  if (!confirm('이 챌린지에 참여하시겠습니까?')) return

  try {
    const result = await joinChallenge(challengeId)
    if (result) {
      toastStore.show('챌린지에 참여했습니다! 🔥', 'success')
      // 정보 갱신
      await challengeStore.fetchChallengeDetail(challengeId)
    }
  } catch (e) {
    console.error(e)
    toastStore.show('참여에 실패했습니다.', 'error')
  }
}
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
        <!-- Standard Header -->
        <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
          <button @click="router.back()" class="text-2xl w-8">←</button>
          <h1 class="font-bold text-lg truncate">챌린지 상세</h1>
          <div class="flex gap-2 relative">
            <button @click="showInviteModal = true" class="text-xl px-1">💌</button>

            <!-- Menu Button -->
            <button @click="isMenuOpen = !isMenuOpen" class="text-xl px-1">⋮</button>

            <!-- Dropdown Menu -->
            <div
              v-if="isMenuOpen"
              class="absolute top-8 right-0 bg-white border shadow-lg rounded-lg w-28 z-50 overflow-hidden flex flex-col"
            >
              <template v-if="isOwner">
                <button
                  @click="handleEditClick"
                  class="text-left text-xs px-3 py-2 hover:bg-gray-50 border-b"
                >
                  설정 ⚙️
                </button>
                <button
                  @click="handleDeleteClick"
                  class="text-left text-xs px-3 py-2 hover:bg-gray-50 text-red-500"
                >
                  삭제 🗑️
                </button>
              </template>
              <template v-if="challenge.isJoined && !isOwner">
                <button
                  @click="handleLeaveClick"
                  class="text-left text-xs px-3 py-2 hover:bg-gray-50 text-gray-500"
                >
                  나가기 👋
                </button>
              </template>
            </div>
          </div>
        </header>

        <!-- Colored Banner (Now strictly below header) -->
        <div
          class="h-[200px] flex flex-col justify-end p-6 text-white relative overflow-hidden shrink-0"
          :class="{
            'bg-gradient-to-br from-orange-400 to-red-500': challenge.type === 'CALORIE_LIMIT',
            'bg-gradient-to-br from-blue-400 to-indigo-500': challenge.type === 'RECORD_FREQUENCY',
            'bg-gradient-to-br from-green-400 to-teal-500': challenge.type === 'TIME_RANGE',
          }"
        >
          <!-- Loading Spinner override inside banner if needed, but we check isLoading outer -->

          <div class="relative z-10 animate-slide-up">
            <span
              class="inline-block px-2 py-1 bg-white/20 backdrop-blur rounded text-[10px] font-bold mb-2"
            >
              {{ dDay }}
            </span>
            <h1 class="text-2xl font-black leading-tight mb-1">{{ challenge.title }}</h1>
            <p class="text-white/80 text-xs mb-2">
              {{ challenge.startDate }} ~ {{ challenge.endDate }}
            </p>

            <div
              class="inline-flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"
            >
              <span class="text-sm">🎯</span>
              <span class="text-[11px] font-bold">
                {{
                  challenge.type === 'CALORIE_LIMIT'
                    ? `하루 ${challenge.targetValue}kcal 이하`
                    : challenge.type === 'RECORD_FREQUENCY'
                      ? `주 ${challenge.targetValue}회 기록`
                      : `식사 ${challenge.targetValue}시간 내`
                }}
              </span>
            </div>
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

            <!-- 아바타 그룹 (기존 유지) -->
            <div class="flex -space-x-3 overflow-hidden py-2 px-1 mb-4">
              <div
                v-for="p in challenge.participants || []"
                :key="p.userId"
                class="relative group cursor-pointer"
                @click.stop="openUserModal(p)"
              >
                <!-- 프로필 이미지 -->
                <img
                  v-if="p.profileImage"
                  :src="p.profileImage"
                  :alt="p.userName"
                  class="w-10 h-10 rounded-full border-2 border-white object-cover transition-transform hover:scale-110 hover:z-10"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs transition-transform hover:scale-110 hover:z-10"
                >
                  {{ p.userName.charAt(0) }}
                </div>
              </div>

              <!-- 참여자가 없을 경우 -->
              <div
                v-if="!challenge.participants || challenge.participants.length === 0"
                class="text-xs text-gray-400 py-2"
              >
                아직 참여자가 없습니다. 첫 번째 도전자가 되어보세요!
              </div>
            </div>

            <!-- 상세 리스트 (진행률 표시) -->
            <div class="space-y-3">
              <div
                v-for="p in challenge.participants || []"
                :key="`list-${p.userId}`"
                class="bg-gray-50 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition"
                @click="openUserModal(p)"
              >
                <img
                  v-if="p.profileImage"
                  :src="p.profileImage"
                  class="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs"
                >
                  {{ p.userName.charAt(0) }}
                </div>

                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-gray-700">{{ p.userName }}</span>
                    <span class="text-xs text-blue-600 font-bold"
                      >{{ p.progressPercent || 0 }}%</span
                    >
                  </div>
                  <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 rounded-full"
                      :style="{ width: `${p.progressPercent || 0}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 참여하기 버튼 (미참여 & 미개설자) -->
            <div v-if="!challenge.isJoined && !isOwner" class="mt-8">
              <button
                @click="handleJoin"
                class="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🔥</span> 챌린지 참여하기
              </button>
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

      <UserInfoModal
        v-if="selectedUser"
        :is-open="showUserModal"
        :user="{
          ...selectedUser,
          profileImage: selectedUser.profileImage || null,
        }"
        :show-challenge-log="challenge?.isJoined"
        @close="showUserModal = false"
        @view-challenge-log="openChallengeLog"
      />

      <DietListModal
        :is-open="isDietListModalOpen"
        :title="`${selectedUser?.userName || '유저'}님의 챌린지 식단`"
        :diet-list="challengeDiets"
        @close="handleDietModalClose"
        :challenge-type="challenge?.type"
        :target-value="challenge?.targetValue"
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
