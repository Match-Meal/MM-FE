<template>
  <div class="bg-gray-200 min-h-screen flex items-center justify-center font-sans text-gray-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-gray-800 flex flex-col"
    >
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-10">
        <div class="flex items-center h-14 px-4">
          <button @click="$router.back()" class="mr-3">
            <svg
              class="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 class="text-lg font-bold">AI 영양 코치</h1>
        </div>

        <!-- Tabs -->
        <div class="flex border-b">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            class="flex-1 py-3 text-sm font-medium transition-colors relative"
            :class="currentTab === tab.id ? 'text-blue-600' : 'text-gray-500'"
          >
            {{ tab.label }}
            <div
              v-if="currentTab === tab.id"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"
            ></div>
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide">
        <!-- 1. Period Feedback Tab -->
        <div v-if="currentTab === 'feedback'" class="space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold mb-4">기간별 식단 분석</h2>
            <p class="text-xs text-gray-500 mb-6">
              최근 식록을 바탕으로 영양 밸런스를 분석해드립니다.
            </p>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="space-y-1">
                <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider"
                  >시작일</label
                >
                <input
                  type="date"
                  v-model="feedbackDate.start"
                  class="w-full p-3 bg-gray-50 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wider"
                  >종료일</label
                >
                <input
                  type="date"
                  v-model="feedbackDate.end"
                  class="w-full p-3 bg-gray-50 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              @click="reqFeedback"
              :disabled="loading"
              class="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-blue-200"
            >
              <span v-if="loading" class="animate-spin mr-2">⏳</span>
              {{ loading ? '분석 중...' : '분석 요청하기' }}
            </button>
          </div>
        </div>

        <!-- 2. Menu Recommendation Tab -->
        <div v-if="currentTab === 'recommend'" class="space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold mb-4">맞춤 메뉴 추천</h2>
            <p class="text-xs text-gray-500 mb-6">
              오늘 먹은 음식과 건강 상태를 고려해 딱 맞는 메뉴를 추천해드려요.
            </p>

            <div class="grid grid-cols-2 gap-3 mb-8">
              <button
                v-for="type in mealTypes"
                :key="type"
                @click="selectedMealType = type"
                class="p-4 rounded-xl text-sm font-medium transition-all"
                :class="
                  selectedMealType === type
                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                "
              >
                {{ type }}
              </button>
            </div>

            <button
              @click="reqRecommend"
              :disabled="loading"
              class="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-blue-200"
            >
              <span v-if="loading" class="animate-spin mr-2">🍳</span>
              {{ loading ? '메뉴 고민 중...' : '메뉴 추천받기' }}
            </button>
          </div>
        </div>

        <!-- 3. History Tab -->
        <div v-if="currentTab === 'history'" class="space-y-4">
          <div v-if="historyLoading" class="flex justify-center py-8">
            <span class="animate-spin text-2xl text-blue-500">⏳</span>
          </div>

          <div
            v-else-if="historyList.length === 0"
            class="flex flex-col items-center justify-center py-20 text-gray-400"
          >
            <span class="text-4xl mb-4">💬</span>
            <p class="text-sm">아직 대화 기록이 없어요.</p>
          </div>

          <div
            v-else
            v-for="(item, index) in historyList"
            :key="index"
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
          >
            <div class="flex justify-between items-start mb-3">
              <span
                class="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide"
                :class="
                  item.aiType === 'FEEDBACK'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                "
              >
                {{ item.aiType === 'FEEDBACK' ? '식단 분석' : '메뉴 추천' }}
              </span>
              <span class="text-[10px] text-gray-400">{{ formatDate(item.createdAt) }}</span>
            </div>

            <div
              v-if="item.question"
              class="mb-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100"
            >
              {{ item.question }}
            </div>

            <div
              class="text-xs text-gray-800 leading-relaxed result-markdown"
              v-html="renderMarkdown(item.answer)"
            ></div>
          </div>
        </div>

        <!-- Result Display Area (For Feedback/Recommend) -->
        <div
          v-if="result && currentTab !== 'history'"
          class="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-blue-100 animate-fade-in-up"
        >
          <div class="flex items-center mb-4 border-b border-gray-100 pb-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              🤖
            </div>
            <h3 class="font-bold text-gray-800 text-sm">AI 코치의 답변</h3>
          </div>
          <div
            class="text-xs text-gray-700 leading-relaxed result-markdown"
            v-html="renderMarkdown(result)"
          ></div>
        </div>
      </div>

      <BottomNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  getPeriodFeedback,
  getMenuRecommendation,
  getAiHistory,
  type AiResponse,
} from '@/services/aiService'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BottomNav from '@/components/common/BottomNav.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()
const currentTab = ref('feedback')
const tabs = [
  { id: 'feedback', label: '기간 분석' },
  { id: 'recommend', label: '메뉴 추천' },
  { id: 'history', label: '히스토리' },
]

const loading = ref(false)
const result = ref('')

// Initialize with options
marked.use({
  breaks: true,
  gfm: true,
})

const renderMarkdown = (text?: string) => {
  if (!text) return ''
  const html = marked.parse(text) as string
  return DOMPurify.sanitize(html)
}

// Period Feedback
const feedbackDate = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
})

const reqFeedback = async () => {
  if (!feedbackDate.value.start || !feedbackDate.value.end) {
    toastStore.show('시작일과 종료일을 선택해주세요.', 'warning')
    return
  }

  loading.value = true
  result.value = ''

  try {
    const res = await getPeriodFeedback(feedbackDate.value.start, feedbackDate.value.end)
    result.value = res
  } catch (e) {
    console.error(e)
    toastStore.show('분석 요청 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// Menu Recommendation
const mealTypes = ['아침', '점심', '저녁', '간식']
const selectedMealType = ref('점심')

const reqRecommend = async () => {
  loading.value = true
  result.value = ''

  try {
    const res = await getMenuRecommendation(selectedMealType.value)
    result.value = res
  } catch (e) {
    console.error(e)
    toastStore.show('추천 요청 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// History
const historyLoading = ref(false)
const historyList = ref<AiResponse[]>([])

const fetchHistory = async () => {
  if (!authStore.user?.id) {
    toastStore.show('로그인 정보가 없습니다.', 'warning')
    return
  }

  historyLoading.value = true
  try {
    const res = await getAiHistory(authStore.user.id)
    historyList.value = res
  } catch (e) {
    console.error(e)
  } finally {
    historyLoading.value = false
  }
}

// Watch tab change to fetch history
watch(currentTab, (newTab) => {
  if (newTab === 'history') {
    fetchHistory()
  } else {
    result.value = '' // Clear result when switching away
  }
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Markdown Styling */
:deep(.result-markdown h1),
:deep(.result-markdown h2),
:deep(.result-markdown h3) {
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

:deep(.result-markdown h1) {
  font-size: 1.5rem;
}
:deep(.result-markdown h2) {
  font-size: 1.25rem;
}
:deep(.result-markdown h3) {
  font-size: 1.1rem;
}

:deep(.result-markdown p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

:deep(.result-markdown ul),
:deep(.result-markdown ol) {
  margin-left: 1.25rem;
  margin-bottom: 0.75rem;
  list-style-type: disc;
}

:deep(.result-markdown ol) {
  list-style-type: decimal;
}

:deep(.result-markdown li) {
  margin-bottom: 0.25rem;
}

:deep(.result-markdown strong) {
  font-weight: 700;
  color: #2b6cb0; /* 강조색 */
}

:deep(.result-markdown blockquote) {
  border-left: 4px solid #e2e8f0;
  padding-left: 1rem;
  color: #718096;
  font-style: italic;
}
</style>
