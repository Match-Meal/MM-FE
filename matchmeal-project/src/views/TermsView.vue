<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex-1 flex flex-col relative overflow-hidden bg-white">
      <header
        class="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-20 shrink-0"
      >
        <button
          @click="goBack"
          class="p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="font-bold text-lg truncate text-slate-800">이용약관</h1>
        <div class="w-8"></div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 text-sm text-slate-600 no-scrollbar leading-relaxed">
        <div class="mb-8">
          <h2 class="font-bold text-lg text-slate-800 mb-2">제1조 (목적)</h2>
          <p class="mb-4">
            본 약관은 <strong>MatchMeal</strong>(이하 "서비스")가 제공하는 AI 기반 식단 관리 및 건강
            커뮤니티 서비스를 이용함에 있어, 회사와 회원의 권리, 의무 및 책임사항을 규정함을
            목적으로 합니다.
          </p>
        </div>

        <div class="mb-8">
          <h2 class="font-bold text-lg text-slate-800 mb-2">제2조 (서비스의 내용)</h2>
          <p class="mb-2">서비스는 다음과 같은 기능을 제공합니다.</p>
          <ul class="list-disc pl-5 space-y-1 mb-4">
            <li>AI 음식 인식 및 영양 성분 분석</li>
            <li>식단 기록 및 캘린더 관리</li>
            <li>커뮤니티 및 챌린지 기능</li>
            <li>건강 리포트 및 통계 제공</li>
          </ul>
        </div>

        <div class="mb-8">
          <h2 class="font-bold text-lg text-slate-800 mb-2">제3조 (건강 정보의 한계)</h2>
          <p class="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            ⚠ <strong>주의:</strong> 본 서비스에서 제공하는 영양 분석 및 AI 코칭은 건강 관리를 돕기
            위한 보조 자료일 뿐이며, <strong>의학적 진단이나 처방을 대신할 수 없습니다.</strong
            ><br /><br />
            특정 질환이 있거나 전문적인 관리가 필요한 경우, 반드시 의사나 전문가와 상담하시기
            바랍니다.
          </p>
        </div>

        <div class="mb-8">
          <h2 class="font-bold text-lg text-slate-800 mb-2">제4조 (데이터의 활용)</h2>
          <p class="mb-4">
            서비스 품질 향상 및 AI 모델 고도화를 위해, 회원이 업로드한 식단 이미지와 영양 정보는
            개인을 식별할 수 없는 형태로 가공되어 학습 데이터로 활용될 수 있습니다.
          </p>
        </div>

        <p class="mt-12 text-xs text-slate-400 text-center">
          공고일자: 2025년 1월 1일<br />
          시행일자: 2025년 1월 1일
        </p>
      </main>
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
