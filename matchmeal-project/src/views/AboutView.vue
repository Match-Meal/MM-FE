<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Github, Linkedin, Mail } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.back()
}

const developers = [
  {
    name: '김세호',
    role: 'Project Lead / Backend / AI',
    image: '',
    github: 'https://github.com/kimseho',
    description:
      'MatchMeal의 전체 아키텍처를 설계하고, 음식 인식을 위한 AI 모델 Serving 및 학습 파이프라인을 구축했습니다.',
  },
  {
    name: 'Mobile PWA Team',
    role: 'Frontend / UI/UX',
    image: '',
    github: '#',
    description:
      '사용자 경험(UX)을 최우선으로 고려하여, 모바일 환경에 최적화된 직관적이고 아름다운 인터페이스를 구현했습니다.',
  },
]
</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <header
        class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0"
      >
        <button
          @click="goBack"
          class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">만든이들</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 no-scrollbar bg-slate-50">
        <div class="text-center mb-8 mt-4">
          <div
            class="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 shadow-md flex items-center justify-center text-4xl border border-slate-100"
          >
            🥗
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-1">MatchMeal</h2>
          <p
            class="text-xs font-bold text-primary-600 bg-primary-50 inline-block px-3 py-1 rounded-full mb-3"
          >
            Smart Diet Assistant
          </p>
          <p class="text-sm text-slate-500 leading-relaxed break-keep px-4">
            "무엇을 먹었는지"만 기록하세요.<br />
            영양 분석과 건강 관리는<br />
            <strong>MatchMeal AI</strong>가 도와드립니다.
          </p>
        </div>

        <div class="space-y-6">
          <div
            v-for="(dev, index) in developers"
            :key="index"
            class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300"
          >
            <div
              class="w-16 h-16 bg-slate-100 rounded-full mb-3 flex items-center justify-center text-2xl shadow-inner border border-white"
            >
              <span v-if="index === 0">👨‍💻</span>
              <span v-else>📱</span>
            </div>
            <h3 class="font-bold text-lg text-slate-800">{{ dev.name }}</h3>
            <span
              class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md mb-3"
              >{{ dev.role }}</span
            >
            <p class="text-xs text-slate-500 mb-4 leading-relaxed break-keep px-2">
              {{ dev.description }}
            </p>

            <div class="flex gap-3" v-if="dev.github !== '#'">
              <a
                :href="dev.github"
                target="_blank"
                class="p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-slate-800 hover:text-white transition"
              >
                <Github :size="16" />
              </a>
            </div>
          </div>
        </div>

        <div class="mt-12 text-center pb-8">
          <p class="text-[10px] text-slate-400 mb-2">Powered by</p>
          <div class="flex justify-center gap-2 grayscale opacity-50">
            <!-- Tech Stack Icons (Text fallback) -->
            <span class="text-xs font-bold border px-2 py-0.5 rounded">Spring Boot</span>
            <span class="text-xs font-bold border px-2 py-0.5 rounded">FastAPI</span>
            <span class="text-xs font-bold border px-2 py-0.5 rounded">Vue.js</span>
          </div>
          <p class="mt-8 text-[10px] text-slate-300">
            © 2025 MatchMeal Project. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
