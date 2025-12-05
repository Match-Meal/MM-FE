<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const skip = () => router.push('/home')
const start = () => router.push('/profile-form')
</script>

<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <div class="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        <div
          class="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-100 rounded-full opacity-50 z-0"
        ></div>
        <div
          class="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-green-100 rounded-full opacity-50 z-0"
        ></div>

        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div
            class="w-28 h-28 bg-blue-50 text-blue-600 rounded-3xl mb-8 flex items-center justify-center text-6xl shadow-sm transform -rotate-3 border border-blue-100"
          >
            📋
          </div>

          <h2 class="text-2xl font-bold mb-4 text-gray-800">잠깐! 프로필을 설정할까요?</h2>
          <p class="text-gray-500 mb-10 leading-relaxed">
            정확한 <span class="text-blue-600 font-bold">AI 식단 추천</span>을 위해<br />
            회원님의 건강 정보를 알려주세요.<br />
            <span class="text-xs text-gray-400 mt-2 block"
              >(나중에 마이페이지에서 언제든 수정 가능해요!)</span
            >
          </p>

          <div class="w-full space-y-3">
            <button
              @click="start"
              class="btn-primary w-full h-14 text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5"
            >
              지금 작성하기
            </button>
            <button
              @click="skip"
              class="w-full h-14 text-gray-400 font-bold text-sm hover:text-gray-600 transition"
            >
              건너뛰기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center transition;
}
</style>
