<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// 공개 설정 상태 (임시: 실제 백엔드 연동 시 store 값으로 초기화)
const isPublic = ref(true)

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
    alert('설정 변경에 실패했습니다. 다시 시도해주세요.')
  }
}

// 모달 상태
const isLogoutModalOpen = ref(false)
const isWithdrawModalOpen = ref(false)

const openLogoutModal = () => {
  isLogoutModalOpen.value = true
}

const openWithdrawModal = () => {
  isWithdrawModalOpen.value = true
}

const handleLogoutConfirm = () => {
  authStore.logout()
  // router.replace 처리 등이 authStore.logout 내부에 있거나 여기서 처리
  // authStore now handles redirect
}

const handleWithdrawConfirm = async () => {
  try {
    await authStore.withdraw()
    // withdraw calls logout on success
  } catch {
    alert('탈퇴 처리에 실패했습니다. 다시 시도해주세요.')
  }
}
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- 헤더 -->
      <header class="h-14 border-b flex items-center justify-between px-4 bg-white z-20">
        <button @click="goBack" class="text-2xl w-8 text-gray-600 hover:text-gray-900 transition">
          ←
        </button>
        <h1 class="font-bold text-lg text-gray-800">설정</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto bg-white scrollbar-hide">
        <!-- 설정 그룹: 계정 -->
        <div class="py-2">
          <h3 class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
            계정 설정
          </h3>

          <!-- 공개 설정 토글 -->
          <div class="p-4 px-6 flex justify-between items-center border-b border-gray-50">
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700 mb-0.5">프로필 공개</span>
              <span
                class="text-xs text-gray-400 transition-colors duration-300"
                :class="isPublic ? 'text-blue-500' : 'text-gray-400'"
              >
                {{ isPublic ? '모든 사람이 볼 수 있어요' : '나만 볼 수 있어요' }}
              </span>
            </div>

            <!-- 토글 스위치 -->
            <div
              @click="togglePrivacy"
              class="w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300"
              :class="isPublic ? 'bg-blue-500' : 'bg-gray-300'"
            >
              <div
                class="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                :class="isPublic ? 'translate-x-5' : 'translate-x-0'"
              ></div>
            </div>
          </div>

          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">내 뱃지 컬렉션 🏆</span>
            <span class="text-gray-300">›</span>
          </div>
        </div>

        <!-- 설정 그룹: 앱 정보 -->
        <div class="py-2">
          <h3 class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
            앱 정보
          </h3>
          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">공지사항</span>
            <span class="text-gray-300">›</span>
          </div>
          <div
            class="p-4 px-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer border-b border-gray-50"
          >
            <span class="text-sm font-medium text-gray-700">버전 정보</span>
            <span class="text-xs text-gray-400">v1.0.0</span>
          </div>
        </div>

        <!-- 로그아웃 버튼 -->
        <div class="p-6 mt-4">
          <button
            @click="openLogoutModal"
            class="w-full py-4 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition mb-3"
          >
            로그아웃
          </button>

          <button
            @click="openWithdrawModal"
            class="w-full py-4 text-xs text-gray-400 font-medium underline"
          >
            회원 탈퇴
          </button>
        </div>

        <!-- Modals -->
        <ConfirmModal
          :is-open="isLogoutModalOpen"
          title="로그아웃"
          message="정말 로그아웃 하시겠습니까?"
          confirm-text="로그아웃"
          @close="isLogoutModalOpen = false"
          @confirm="handleLogoutConfirm"
        />

        <ConfirmModal
          :is-open="isWithdrawModalOpen"
          title="회원 탈퇴"
          message="정말 탈퇴하시겠습니까?
          
탈퇴 시 계정은 3개월간 보관되며,
이 기간 내에 로그인하면 복구할 수 있습니다.
3개월 후에는 모든 데이터가 영구 삭제됩니다."
          confirm-text="탈퇴하기"
          @close="isWithdrawModalOpen = false"
          @confirm="handleWithdrawConfirm"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
