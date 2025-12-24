<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '@/stores/toast'
import { useConfirmStore } from '@/stores/confirm'
import SubscriptionModal from '@/components/payment/SubscriptionModal.vue'
import SubscriptionCancelModal from '@/components/payment/SubscriptionCancelModal.vue'
import SubscriptionReactivateModal from '@/components/payment/SubscriptionReactivateModal.vue'
import NotificationSettingsModal from '@/components/settings/NotificationSettingsModal.vue'

import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Award,
  Bell,
  Info,
  UserX,
  FileText,
  Users,
} from 'lucide-vue-next'

import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()

// 공개 설정 상태
const isPublic = ref(true)

// 모달 상태
const isSubscriptionModalOpen = ref(false)
const isCancelModalOpen = ref(false)
const isReactivateModalOpen = ref(false)
const isNotificationModalOpen = ref(false)

const handleSubscriptionReactivated = async () => {
  await authStore.fetchUser()
}

onMounted(async () => {
  // 1. 유저 정보가 없으면 로드
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }

  // 2. 스토어의 isPublic 값을 로컬 상태에 반영
  if (authStore.user) {
    // 백엔드 데이터가 null일 경우 기본값 true로 설정
    isPublic.value = authStore.user.isPublic !== false
  }
})

const goBack = () => router.back()

// 구독 정보 갱신 (해지 후 호출)
const handleSubscriptionCancelled = async () => {
  // 유저 정보 갱신하면 role이 바뀌므로 UI 자동 업데이트
  await authStore.fetchUser()
}

const togglePrivacy = async () => {
  const previousValue = isPublic.value
  const newValue = !previousValue

  isPublic.value = newValue
  try {
    // 2. 백엔드 API 호출 (PATCH)
    await axios.patch('http://localhost:8080/user/visibility', {
      isPublic: newValue,
    })

    // 3. 성공 시 스토어 상태도 업데이트 (새로고침 없이 데이터 동기화)
    if (authStore.user) {
      authStore.user.isPublic = newValue
    }
    console.log(`공개 설정 변경 성공: ${newValue ? '공개' : '비공개'}`)
  } catch (e) {
    console.error('공개 설정 변경 실패', e)

    // 4. 실패 시 UI 원복 (롤백)
    isPublic.value = previousValue
    toastStore.show('설정 변경에 실패했습니다. 다시 시도해주세요.', 'error')
  }
}

// 로그아웃 핸들러
const handleLogout = async () => {
  const isConfirmed = await confirmStore.show('정말 로그아웃 하시겠습니까?')
  if (!isConfirmed) return
  await authStore.logout()
}

// 회원 탈퇴 핸들러
const handleWithdraw = async () => {
  const isConfirmed = await confirmStore.show(
    '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
    '회원 탈퇴',
    '탈퇴하기',
    '취소',
  )
  if (!isConfirmed) return

  try {
    await authStore.withdraw()
    toastStore.show('회원 탈퇴가 완료되었습니다.', 'success')
    router.push('/login')
  } catch (e) {
    console.error(e)
    toastStore.show('탈퇴 처리에 실패했습니다. 다시 시도해주세요.', 'error')
  }
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      id="mobile-frame"
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- 헤더 -->
      <header class="relative bg-white border-b border-slate-100 h-14 flex items-center px-4 sticky top-0 z-10 shrink-0">
        <button
          @click="router.back()"
          class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600 z-10 relative"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-slate-800">
          설정
        </h1>
      </header>

      <main class="flex-1 overflow-y-auto bg-white no-scrollbar">
        <!-- 설정 그룹: 멤버십 -->
        <div class="py-2">
          <h3
            class="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50"
          >
            멤버십 관리
          </h3>

          <!-- 구독 상태 표시 -->
          <div class="p-4 px-6 border-b border-slate-50">
            <div v-if="authStore.user?.role === 'ROLE_SUBSCRIBER'" class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Award :size="18" class="text-yellow-500" /> 프리미엄 구독 중
                </span>
                <span
                  v-if="authStore.subscription?.status === 'CANCELED'"
                  class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg"
                  >해지 예정</span
                >
                <span
                  v-else
                  class="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg"
                  >Active</span
                >
              </div>
              <p class="text-xs text-slate-500">
                AI 챗봇 무제한 이용 등 다양한 혜택을 누리고 계십니다.
                <br v-if="authStore.subscription?.nextBillingDate" />
                <span
                  v-if="authStore.subscription?.nextBillingDate"
                  class="text-slate-400 mt-1 block"
                >
                  <span v-if="authStore.subscription?.status === 'CANCELED'">
                    이용 만료일: {{ authStore.subscription.nextBillingDate }}
                  </span>
                  <span v-else> 다음 결제일: {{ authStore.subscription.nextBillingDate }} </span>
                </span>
              </p>

              <button
                v-if="authStore.subscription?.status === 'CANCELED'"
                @click="isReactivateModalOpen = true"
                class="w-full mt-2 py-3 border border-blue-200 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition shadow-sm"
              >
                구독 다시 시작하기 (결제일 유지)
              </button>
              <button
                v-else
                @click="isCancelModalOpen = true"
                class="w-full mt-2 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
              >
                구독 관리 / 해지
              </button>
            </div>

            <div v-else class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Award :size="18" class="text-slate-400" /> 무료 회원
                </span>
              </div>
              <p class="text-xs text-slate-500">프리미엄 구독으로 AI 영양 상담을 받아보세요!</p>
              <button
                @click="isSubscriptionModalOpen = true"
                class="w-full mt-2 py-3 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition shadow-md shadow-primary-200"
              >
                프리미엄 구독하기
              </button>
            </div>
          </div>
        </div>

        <!-- 설정 그룹: 계정 -->
        <div class="py-2">
          <h3
            class="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50"
          >
            계정 설정
          </h3>

          <!-- 공개 설정 토글 -->
          <div class="p-4 px-6 flex justify-between items-center border-b border-slate-50">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-700 mb-0.5">프로필 공개</span>
              <span
                class="text-xs transition-colors duration-300"
                :class="isPublic ? 'text-primary-600' : 'text-slate-400'"
              >
                {{ isPublic ? '모든 사람이 볼 수 있어요' : '나만 볼 수 있어요' }}
              </span>
            </div>

            <!-- 토글 스위치 -->
            <div
              @click="togglePrivacy"
              class="w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300"
              :class="isPublic ? 'bg-primary-500' : 'bg-slate-300'"
            >
              <div
                class="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                :class="isPublic ? 'translate-x-5' : 'translate-x-0'"
              ></div>
            </div>
          </div>

          <!-- 알림 설정 -->
          <div
            @click="isNotificationModalOpen = true"
            class="p-4 px-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition"
          >
            <span class="text-sm font-bold text-slate-700 flex items-center gap-2"
              ><Bell :size="18" class="text-slate-400" /> 알림 설정</span
            >
            <ChevronRight :size="16" class="text-slate-300" />
          </div>

          <!-- 회원 탈퇴 -->
          <button
            @click="handleWithdraw"
            class="w-full p-4 px-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition text-left"
          >
            <span class="text-sm font-bold text-slate-700 flex items-center gap-2"
              ><UserX :size="18" class="text-slate-400" /> 회원 탈퇴</span
            >
            <ChevronRight :size="16" class="text-slate-300" />
          </button>
        </div>

        <!-- 설정 그룹: 앱 정보 -->
        <div class="py-2">
          <h3
            class="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50"
          >
            앱 정보
          </h3>
          <div
            @click="router.push('/terms')"
            class="p-4 px-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition"
          >
            <span class="text-sm font-bold text-slate-700 flex items-center gap-2"
              ><FileText :size="18" class="text-slate-400" /> 이용약관</span
            >
            <ChevronRight :size="16" class="text-slate-300" />
          </div>
          <div
            @click="router.push('/about')"
            class="p-4 px-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition"
          >
            <span class="text-sm font-bold text-slate-700 flex items-center gap-2"
              ><Users :size="18" class="text-slate-400" /> 만든이들</span
            >
            <ChevronRight :size="16" class="text-slate-300" />
          </div>
          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition"
          >
            <span class="text-sm font-bold text-slate-700 flex items-center gap-2"
              ><Info :size="18" class="text-slate-400" /> 버전 정보</span
            >
            <span class="text-xs text-slate-400 font-bold">v1.0.0</span>
          </div>
        </div>

        <!-- 로그아웃 버튼 -->
        <div class="p-6 mt-4">
          <button
            @click="handleLogout"
            class="w-full bg-slate-100 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-200 transition mb-3"
          >
            <LogOut :size="20" />
            로그아웃
          </button>
        </div>
      </main>

      <!-- Modals -->
      <SubscriptionModal
        :is-open="isSubscriptionModalOpen"
        @close="isSubscriptionModalOpen = false"
      />

      <SubscriptionCancelModal
        :is-open="isCancelModalOpen"
        :next-billing-date="authStore.subscription?.nextBillingDate || null"
        @close="isCancelModalOpen = false"
        @cancelled="handleSubscriptionCancelled"
      />

      <SubscriptionReactivateModal
        :is-open="isReactivateModalOpen"
        :next-billing-date="authStore.subscription?.nextBillingDate || ''"
        @close="isReactivateModalOpen = false"
        @reactivated="handleSubscriptionReactivated"
      />

      <NotificationSettingsModal
        :is-open="isNotificationModalOpen"
        @close="isNotificationModalOpen = false"
      />
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
