<script setup lang="ts">
import { ref } from 'vue'
import { X, Bell, Utensils, Megaphone, Heart, Users, Trophy } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

// 로컬 상태 (실제로는 API 연동 필요)
const isDietAlertOn = ref(true)
const isNoticeAlertOn = ref(true)
const isSocialAlertOn = ref(true)
const isFollowingAlertOn = ref(true)
const isChallengeAlertOn = ref(true)

const close = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50 flex items-end justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div class="relative w-full bg-white rounded-t-[30px] p-6 pb-10 shadow-2xl animate-slide-up">
      <!-- Handle bar -->
      <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

      <div class="flex justify-between items-center mb-8">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Bell :size="20" class="text-primary-600" /> 알림 설정
        </h2>
        <button @click="close" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition">
          <X :size="24" />
        </button>
      </div>

      <div class="space-y-6">
        <!-- 1. 식단 기록 리마인더 (기존 유지) -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
            >
              <Utensils :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-700">식단 기록 리마인더</h3>
              <p class="text-xs text-slate-400">아침, 점심, 저녁 식사 시간 알림</p>
            </div>
          </div>
          <button
            @click="isDietAlertOn = !isDietAlertOn"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isDietAlertOn ? 'bg-primary-500' : 'bg-slate-200'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
              :class="isDietAlertOn ? 'left-[24px]' : 'left-1'"
            ></div>
          </button>
        </div>

        <!-- 2. 공지사항 (Notice) -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"
            >
              <Megaphone :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-700">공지사항</h3>
              <p class="text-xs text-slate-400">서비스 중요 공지 및 이벤트 소식</p>
            </div>
          </div>
          <button
            @click="isNoticeAlertOn = !isNoticeAlertOn"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isNoticeAlertOn ? 'bg-primary-500' : 'bg-slate-200'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
              :class="isNoticeAlertOn ? 'left-[24px]' : 'left-1'"
            ></div>
          </button>
        </div>

        <!-- 3. 내 소식 (Social: Like, Comment, Follow) -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center"
            >
              <Heart :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-700">내 소식</h3>
              <p class="text-xs text-slate-400">좋아요, 댓글, 답글, 새 팔로워 알림</p>
            </div>
          </div>
          <button
            @click="isSocialAlertOn = !isSocialAlertOn"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isSocialAlertOn ? 'bg-primary-500' : 'bg-slate-200'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
              :class="isSocialAlertOn ? 'left-[24px]' : 'left-1'"
            ></div>
          </button>
        </div>

        <!-- 4. 팔로잉 새 글 (Following Activity) -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"
            >
              <Users :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-700">팔로잉 새 글</h3>
              <p class="text-xs text-slate-400">내가 팔로우한 유저의 새 게시글 알림</p>
            </div>
          </div>
          <button
            @click="isFollowingAlertOn = !isFollowingAlertOn"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isFollowingAlertOn ? 'bg-primary-500' : 'bg-slate-200'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
              :class="isFollowingAlertOn ? 'left-[24px]' : 'left-1'"
            ></div>
          </button>
        </div>

        <!-- 5. 챌린지 초대 (Challenge Invite) -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"
            >
              <Trophy :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-700">챌린지 초대</h3>
              <p class="text-xs text-slate-400">챌린지 함께하기 초대 알림</p>
            </div>
          </div>
          <button
            @click="isChallengeAlertOn = !isChallengeAlertOn"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isChallengeAlertOn ? 'bg-primary-500' : 'bg-slate-200'"
          >
            <div
              class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
              :class="isChallengeAlertOn ? 'left-[24px]' : 'left-1'"
            ></div>
          </button>
        </div>
      </div>

      <p class="mt-8 text-[10px] text-slate-400 text-center">
        기기 설정에서 알림 권한이 허용되어 있어야 합니다.
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
