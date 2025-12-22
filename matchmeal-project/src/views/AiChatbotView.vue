<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans text-slate-800">
    <div
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-850 flex flex-col"
    >
      <!-- Header -->
      <header class="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div class="flex items-center h-14 px-4">
          <button
            @click="$router.back()"
            class="mr-3 p-2 -ml-2 rounded-full hover:bg-slate-50 transition text-slate-600"
          >
            <ArrowLeft :size="24" />
          </button>
          <h1 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bot :size="24" class="text-primary-600" />
            AI 영양 코치
          </h1>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-100">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            class="flex-1 py-3 text-sm font-bold transition-all relative"
            :class="
              currentTab === tab.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
            "
          >
            {{ tab.label }}
            <div
              v-if="currentTab === tab.id"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"
            ></div>
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide bg-slate-50">
        <!-- 1. Period Feedback Tab -->
        <div v-if="currentTab === 'feedback'" class="space-y-6">
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 class="text-lg font-bold mb-2 text-slate-800 flex items-center gap-2">
              <BarChart3 :size="20" class="text-primary-500" /> 기간별 식단 분석
            </h2>
            <p class="text-xs text-slate-500 mb-6 leading-relaxed">
              최근 식사 기록을 바탕으로 영양 밸런스를 분석해드립니다.
            </p>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="space-y-1">
                <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                  >시작일</label
                >
                <input
                  type="date"
                  v-model="feedbackDate.start"
                  class="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:border-primary-500 transition text-slate-700"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                  >종료일</label
                >
                <input
                  type="date"
                  v-model="feedbackDate.end"
                  class="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:border-primary-500 transition text-slate-700"
                />
              </div>
            </div>

            <button
              @click="reqFeedback"
              :disabled="loading"
              class="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-primary-200 active:scale-[0.98]"
            >
              <Loader2 v-if="loading" class="animate-spin mr-2" :size="20" />
              {{ loading ? '분석 중...' : '분석 요청하기' }}
            </button>
          </div>
        </div>

        <!-- 2. Menu Recommendation Tab -->
        <div v-if="currentTab === 'recommend'" class="space-y-6">
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 class="text-lg font-bold mb-2 text-slate-800 flex items-center gap-2">
              <Utensils :size="20" class="text-orange-500" /> 맞춤 메뉴 추천
            </h2>
            <p class="text-xs text-slate-500 mb-6 leading-relaxed">
              오늘 먹은 음식과 건강 상태를 고려해 딱 맞는 메뉴를 추천해드려요.
            </p>

            <div class="grid grid-cols-2 gap-3 mb-8">
              <button
                v-for="type in mealTypes"
                :key="type"
                @click="selectedMealType = type"
                class="p-4 rounded-xl text-sm font-bold transition-all border"
                :class="
                  selectedMealType === type
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-[1.02]'
                    : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                "
              >
                {{ type }}
              </button>
            </div>

            <button
              @click="reqRecommend"
              :disabled="loading"
              class="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-primary-200 active:scale-[0.98]"
            >
              <Loader2 v-if="loading" class="animate-spin mr-2" :size="20" />
              <Sparkles v-else class="mr-2 text-yellow-300" :size="20" />
              {{ loading ? '메뉴 고민 중...' : '메뉴 추천받기' }}
            </button>
          </div>
        </div>

        <!-- 3. History Tab -->
        <div v-if="currentTab === 'history'" class="space-y-4">
          <div v-if="historyLoading" class="flex justify-center py-8">
            <Loader2 class="animate-spin text-primary-500" :size="32" />
          </div>

          <div
            v-else-if="historyList.length === 0"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <MessageSquare :size="48" class="mb-4 text-slate-300" />
            <p class="text-sm font-medium">아직 대화 기록이 없어요.</p>
          </div>

          <div
            v-else
            v-for="(item, index) in historyList"
            :key="index"
            class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
          >
            <div class="flex justify-between items-start mb-3">
              <span
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border"
                :class="
                  item.aiType === 'FEEDBACK'
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-green-50 text-green-600 border-green-100'
                "
              >
                {{ item.aiType === 'FEEDBACK' ? '식단 분석' : '메뉴 추천' }}
              </span>
              <span class="text-[10px] text-slate-400 font-medium">{{
                formatDate(item.createdAt)
              }}</span>
            </div>

            <div
              v-if="item.question"
              class="mb-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium"
            >
              Q. {{ item.question }}
            </div>

            <div
              class="text-xs text-slate-800 leading-relaxed result-markdown"
              v-html="renderMarkdown(item.answer)"
            ></div>
          </div>
        </div>

        <!-- Result Display Area (For Feedback/Recommend) -->
        <div
          v-if="result && currentTab !== 'history'"
          class="mt-6 bg-white rounded-3xl p-6 shadow-float border border-primary-100 animate-fade-in-up"
        >
          <div class="flex items-center mb-4 border-b border-slate-100 pb-3">
            <div
              class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mr-3 text-primary-600 shadow-sm border border-primary-100"
            >
              <Bot :size="24" />
            </div>
            <h3 class="font-bold text-slate-800 text-sm">AI 코치의 답변</h3>
          </div>
          <div
            class="text-xs text-slate-700 leading-relaxed result-markdown"
            v-html="renderMarkdown(result)"
          ></div>
        </div>
      </div>

      <BottomNav />

      <!-- 구독 유도 모달 -->
      <SubscriptionRequiredModal
        :is-open="isSubscriptionModalOpen"
        @close="handleCloseSubscriptionModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useRouter } from 'vue-router'
import {
  getPeriodFeedback,
  getMenuRecommendation,
  getAiHistory,
  type AiResponse,
} from '@/services/aiService'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BottomNav from '@/components/common/BottomNav.vue'
import SubscriptionRequiredModal from '@/components/common/SubscriptionRequiredModal.vue'
import {
  ArrowLeft,
  Bot,
  Loader2,
  BarChart3,
  Utensils,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next'

const router = useRouter()
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

// 구독 모달 제어
const isSubscriptionModalOpen = ref(false)

onMounted(async () => {
  // 1. 유저 정보 확인
  if (!authStore.user && authStore.token) {
    await authStore.fetchUser()
  }

  // 2. 권한 체크 (ROLE_SUBSCRIBER만 이용 가능)
  if (authStore.user?.role !== 'ROLE_SUBSCRIBER') {
    isSubscriptionModalOpen.value = true
  }
})

// 모달 닫기 시 뒤로가기 (접근 차단)
const handleCloseSubscriptionModal = () => {
  isSubscriptionModalOpen.value = false
  router.back()
}

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
  font-weight: 800;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #1e293b; /* slate-800 */
}

:deep(.result-markdown h1) {
  font-size: 1.25rem;
}
:deep(.result-markdown h2) {
  font-size: 1.1rem;
}
:deep(.result-markdown h3) {
  font-size: 1rem;
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
  color: #2563eb; /* primary-600 */
}

:deep(.result-markdown blockquote) {
  border-left: 4px solid #cbd5e1; /* slate-300 */
  padding-left: 1rem;
  color: #64748b; /* slate-500 */
  font-style: italic;
  background-color: #f8fafc; /* slate-50 */
  padding: 0.5rem 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
}
</style>
