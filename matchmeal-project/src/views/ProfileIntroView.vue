<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ClipboardList } from 'lucide-vue-next'

const router = useRouter()

const skip = () => router.push('/home')
const start = () => router.push('/profile-form')
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
        <!-- Bubbles -->
        <div
          class="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary-100 rounded-full opacity-50 z-0"
        ></div>
        <div
          class="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-emerald-100 rounded-full opacity-50 z-0"
        ></div>

        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div
            class="w-28 h-28 bg-primary-50 text-primary-600 rounded-3xl mb-8 flex items-center justify-center text-6xl shadow-sm transform -rotate-3 border border-primary-100 animate-float"
          >
            <ClipboardList :size="48" />
          </div>

          <h2 class="text-2xl font-bold mb-4 text-slate-900">잠깐! 프로필을 설정할까요?</h2>
          <p class="text-slate-500 mb-10 leading-relaxed font-medium">
            정확한 <span class="text-primary-600 font-bold">AI 식단 추천</span>을 위해<br />
            회원님의 건강 정보를 알려주세요.<br />
            <span class="text-xs text-slate-400 mt-2 block font-normal"
              >(나중에 마이페이지에서 언제든 수정 가능해요!)</span
            >
          </p>

          <div class="w-full space-y-3">
            <button
              @click="start"
              class="w-full h-14 bg-primary-600 text-white font-bold rounded-2xl flex items-center justify-center text-lg shadow-lg shadow-primary-200 hover:bg-primary-700 transition transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              지금 작성하기
            </button>
            <button
              @click="skip"
              class="w-full h-14 text-slate-400 font-bold text-sm hover:text-slate-600 transition"
            >
              건너뛰기
            </button>
          </div>
        </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0% { transform: translateY(0px) rotate(-3deg); }
  50% { transform: translateY(-10px) rotate(-3deg); }
  100% { transform: translateY(0px) rotate(-3deg); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
