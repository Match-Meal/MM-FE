<script setup lang="ts">
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChallengeStore } from '@/stores/challenge'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useConfirmStore } from '@/stores/confirm'
import type { ChallengeCreateRequest } from '@/services/challengeService'

import ChallengeCreateForm from '@/components/ChallengeCreateForm.vue'
import InviteModal from '@/components/InviteModal.vue'
import UserInfoModal from '@/components/UserInfoModal.vue'
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
import { 
  ArrowLeft, 
  Mail, 
  MoreVertical, 
  Settings, 
  Trash2, 
  LogOut, 
  Target, 
  Flame,
  User as UserIcon,
  ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()

const challengeId = Number(route.params.id)

const challenge = computed(() => challengeStore.currentChallenge)

// 모달 상태
const showEditModal = ref(false)
const showInviteModal = ref(false)
const showUserModal = ref(false)
const selectedUser = ref<ChallengeParticipantDto | null>(null)
const isMenuOpen = ref(false)

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
    console.log('Diet List from Period API:', list)

    let mappedList =
      list?.map((item: DailyDietResponseItem & { dietDetails?: DietDetailItem[] }) => ({
        ...item,
        details: item.details || item.dietDetails || [],
      })) || []

    if (mappedList.length > 0 && mappedList.some((d) => d.details.length === 0 && d.memo === '')) {
      try {
        const detailPromises = mappedList.map(async (diet) => {
          if (diet.details && diet.details.length > 0) return diet
          const detailRes = await getDietDetail(diet.dietId)
          return detailRes.data
        })

        const detailedResults = await Promise.all(detailPromises)
        mappedList = detailedResults
      } catch (err) {
        console.warn('Failed to fetch individual diet details', err)
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

const handleEditClick = () => {
  showEditModal.value = true
  isMenuOpen.value = false
}

const handleDeleteClick = () => {
  handleDelete()
  isMenuOpen.value = false
}

const handleLeaveClick = () => {
  handleQuit()
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

// 챌린지 삭제 (방장 전용)
const handleDelete = async () => {
  if (!challenge.value) return
  if (
    !(await confirmStore.show(
      '챌린지를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      '챌린지 삭제',
      '삭제',
      '취소',
    ))
  )
    return
  try {
    await deleteChallenge(challengeId)
    toastStore.show('챌린지가 삭제되었습니다.', 'info')
    router.replace('/challenge')
  } catch (e) {
    console.error(e)
    toastStore.show('삭제에 실패했습니다.', 'error')
  }
}

// 챌린지 나가기
const handleQuit = async () => {
  if (!challenge.value) return
  if (
    !(await confirmStore.show(
      '정말 챌린지를 포기하시겠습니까?\n중도 포기 시 기록은 유지되지만 순위에서 제외됩니다.',
      '챌린지 포기',
    ))
  )
    return
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
  if (!challenge.value) return
  if (!(await confirmStore.show('이 챌린지에 참여하시겠습니까?'))) return
  try {
    const result = await joinChallenge(challengeId)
    if (result) {
      toastStore.show('챌린지에 참여했습니다.', 'success')
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
  <div class="bg-gray-100 min-h-screen flex items-center justify-center text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <div
        v-if="challengeStore.isLoading || !challenge"
        class="flex-1 flex items-center justify-center"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <template v-else>
        <!-- Standard Header -->
        <header class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0">
          <button @click="router.back()" class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft :size="24" />
          </button>
          <h1 class="font-bold text-lg truncate text-slate-800">챌린지 상세</h1>
          <div class="flex gap-2 relative">
            <button @click="showInviteModal = true" class="p-2 rounded-full hover:bg-slate-50 transition text-slate-600">
                <Mail :size="20" />
            </button>

            <!-- Menu Button -->
            <button @click="isMenuOpen = !isMenuOpen" class="p-2 rounded-full hover:bg-slate-50 transition text-slate-600">
                <MoreVertical :size="20" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isMenuOpen"
              class="absolute top-12 right-0 bg-white border border-slate-100 shadow-xl rounded-xl w-32 z-50 overflow-hidden flex flex-col"
            >
              <template v-if="isOwner">
                <button
                  @click="handleEditClick"
                  class="text-left text-xs px-4 py-3 hover:bg-slate-50 border-b border-slate-50 font-bold text-slate-600 flex items-center gap-2"
                >
                  <Settings :size="14" /> 설정
                </button>
                <button
                  @click="handleDeleteClick"
                  class="text-left text-xs px-4 py-3 hover:bg-rose-50 text-rose-500 font-bold flex items-center gap-2"
                >
                  <Trash2 :size="14" /> 삭제
                </button>
              </template>
              <template v-if="challenge.isJoined && !isOwner">
                <button
                  @click="handleLeaveClick"
                  class="text-left text-xs px-4 py-3 hover:bg-slate-50 text-slate-500 font-bold flex items-center gap-2"
                >
                  <LogOut :size="14" /> 나가기
                </button>
              </template>
            </div>
          </div>
        </header>

        <!-- Colored Banner (Now strictly below header) -->
        <div
          class="h-[200px] flex flex-col justify-end px-6 pt-6 pb-10 text-white relative overflow-hidden shrink-0"
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
            <p class="text-white/80 text-xs mb-2 font-medium">
              {{ challenge.startDate }} ~ {{ challenge.endDate }}
            </p>

            <div
              class="inline-flex items-center gap-1 bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-sm"
            >
              <Target :size="14" />
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
          class="flex-1 bg-white -mt-6 rounded-t-[30px] relative z-0 p-6 overflow-y-auto scrollbar-hide space-y-8 animate-slide-up-delayed"
        >
          <div class="text-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="text-xs text-slate-500 font-bold mb-1">현재 달성률</div>
            <div class="text-3xl font-black text-primary-600 mb-3 tracking-tight">
              {{ challenge.progressPercent }}<span class="text-lg text-primary-400 align-top">%</span>
            </div>
            <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: `${challenge.progressPercent}%` }"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-slate-400 font-bold">
              <span>0%</span>
              <span>성공 {{ challenge.currentCount }} / {{ challenge.goalCount }}회</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-slate-800 mb-2">챌린지 소개</h3>
            <p class="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl min-h-[80px] border border-slate-100 font-medium">
              {{ challenge.description || '설명이 없습니다.' }}
            </p>
          </div>

          <div>
            <div class="flex items-end justify-between mb-3">
                 <h3 class="text-sm font-bold text-slate-800">
                    참여 멤버 <span class="text-primary-600 text-xs ml-1">{{ challenge.currentHeadCount || 0 }}/{{ challenge.maxParticipants }}</span>
                </h3>
            </div>

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
                  class="w-10 h-10 rounded-full border-2 border-white object-cover transition-transform hover:scale-110 hover:z-10 shadow-sm"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs transition-transform hover:scale-110 hover:z-10 shadow-sm text-slate-400"
                >
                  <UserIcon :size="16" />
                </div>
              </div>

              <!-- 참여자가 없을 경우 -->
              <div
                v-if="!challenge.participants || challenge.participants.length === 0"
                class="text-xs text-slate-400 py-2"
              >
                아직 참여자가 없습니다. 첫 번째 도전자가 되어보세요!
              </div>
            </div>

            <!-- 상세 리스트 (진행률 표시) -->
            <div class="space-y-3">
              <div
                v-for="p in challenge.participants || []"
                :key="`list-${p.userId}`"
                class="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-primary-200 hover:shadow-md transition group"
                @click="openUserModal(p)"
              >
                <img
                  v-if="p.profileImage"
                  :src="p.profileImage"
                  class="w-10 h-10 rounded-full object-cover border border-slate-100"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs text-slate-300"
                >
                  <UserIcon :size="16" />
                </div>

                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-slate-700 group-hover:text-primary-700 transition">{{ p.userName }}</span>
                    <span class="text-xs text-primary-600 font-bold"
                      >{{ p.progressPercent || 0 }}%</span
                    >
                  </div>
                  <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary-400 rounded-full"
                      :style="{ width: `${p.progressPercent || 0}%` }"
                    ></div>
                  </div>
                </div>
                <ChevronRight :size="16" class="text-slate-300 group-hover:text-primary-400" />
              </div>
            </div>

            <!-- 참여하기 버튼 (미참여 & 미개설자) -->
            <div v-if="!challenge.isJoined && !isOwner" class="mt-8">
              <button
                @click="handleJoin"
                class="w-full h-14 bg-accent text-slate-900 font-bold rounded-2xl shadow-lg shadow-yellow-100 hover:brightness-105 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Flame :size="20" class="fill-slate-900" /> 챌린지 참여하기
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
