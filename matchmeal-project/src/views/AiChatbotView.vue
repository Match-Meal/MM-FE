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
      <div class="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
        <!-- 1. Period Feedback Tab -->
        <div
          v-if="currentTab === 'feedback'"
          class="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide space-y-6"
        >
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

          <!-- Result Area (Inside Scrollable) -->
          <div
            v-if="feedbackResult && currentTab === 'feedback'"
            class="bg-white rounded-3xl p-6 shadow-float border border-primary-100 animate-fade-in-up"
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
              v-html="renderMarkdown(feedbackResult)"
            ></div>

            <div class="mt-8 pt-6 border-t border-slate-100">
              <button
                @click="isPeriodModalOpen = true"
                class="w-full py-4 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all flex justify-center items-center shadow-sm active:scale-[0.98]"
              >
                <Calendar :size="18" class="mr-2" />
                이 기간에 맞는 식단표 받기
              </button>

              <div
                v-if="mealPlanLoading"
                class="mt-4 flex flex-col items-center text-primary-600 animate-pulse"
              >
                <Loader2 class="animate-spin mb-2" :size="24" />
                <span class="text-xs font-bold">식단을 분석하고 있습니다...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Menu Recommendation Tab -->
        <div
          v-if="currentTab === 'recommend'"
          class="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide space-y-6"
        >
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

            <!-- Flavor Selection -->
            <div class="mb-8">
              <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider"
                >선호하는 맛 / 취향</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="flavor in flavorOptions"
                  :key="flavor"
                  @click="toggleFlavor(flavor)"
                  class="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                  :class="
                    selectedFlavors.includes(flavor)
                      ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm'
                      : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                  "
                >
                  {{ flavor }}
                </button>
              </div>
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

          <!-- Result Area (Inside Scrollable) -->
          <div
            v-if="recommendResult && currentTab === 'recommend'"
            class="bg-white rounded-3xl p-6 shadow-float border border-primary-100 animate-fade-in-up"
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
              v-html="renderMarkdown(recommendResult)"
            ></div>
          </div>
        </div>

        <!-- 3. Chat Tab -->
        <div v-if="currentTab === 'chat'" class="flex-1 flex flex-col h-full overflow-hidden">
          <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Welcome -->
            <div
              v-if="chatMessages.length === 0"
              class="flex flex-col items-center justify-center py-10 text-slate-500/70 min-h-[300px]"
            >
              <Bot :size="40" class="mb-3 text-slate-400" />
              <p class="text-xs font-medium">무엇이든 물어보세요!</p>
            </div>

            <!-- Messages Loop -->
            <div v-for="item in processedMessages" :key="item.id">
              <!-- Date Header -->
              <div v-if="item.type === 'DATE'" class="flex justify-center mb-4">
                <span class="bg-black/10 text-white text-[10px] px-3 py-1 rounded-full">
                  {{ item.fullDate }}
                </span>
              </div>

              <!-- Message -->
              <div
                v-else
                class="flex w-full mb-1"
                :class="item.type === 'USER' ? 'justify-end' : 'justify-start'"
              >
                <!-- AI Profile -->
                <div v-if="item.type === 'AI'" class="mr-2 flex-shrink-0 flex items-start">
                  <div
                    class="w-8 h-8 rounded-[12px] bg-white overflow-hidden shadow-sm flex items-center justify-center border border-black/5"
                  >
                    <Bot :size="20" class="text-slate-800" />
                  </div>
                </div>

                <div class="flex flex-col max-w-[85%]">
                  <div
                    class="flex items-end gap-1.5"
                    :class="item.type === 'USER' ? 'flex-row-reverse' : 'flex-row'"
                  >
                    <!-- Bubble -->
                    <div
                      class="px-3 py-2 text-xs leading-relaxed shadow-sm relative group"
                      :class="[
                        item.type === 'USER'
                          ? 'bg-primary-600 text-white rounded-[12px] rounded-tr-[2px]'
                          : 'bg-white border border-slate-100 text-slate-700 rounded-[12px] rounded-tl-[2px]',
                      ]"
                    >
                      <span v-if="item.type === 'USER'">{{ item.text }}</span>
                      <div v-else class="result-markdown" v-html="renderMarkdown(item.text)"></div>
                    </div>

                    <!-- Time -->
                    <span class="text-[9px] text-slate-500/80 mb-0.5 whitespace-nowrap">
                      {{ item.displayTime }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading Bubble -->
            <div v-if="chatLoading" class="flex justify-start w-full mt-2">
              <div class="mr-2 flex-shrink-0">
                <div
                  class="w-8 h-8 rounded-[12px] bg-white overflow-hidden shadow-sm flex items-center justify-center border border-black/5"
                >
                  <Bot :size="20" class="text-slate-800" />
                </div>
              </div>
              <div class="bg-white px-4 py-3 rounded-[12px] rounded-tl-[2px] shadow-sm">
                <Loader2 class="animate-spin text-slate-400" :size="14" />
              </div>
            </div>
          </div>

          <!-- Fixed Input -->
          <div class="bg-white border-t border-slate-100 p-3 pb-safe-bottom">
            <div class="flex gap-2">
              <input
                v-model="chatInput"
                @keyup.enter="handleSendMessage"
                placeholder="질문을 입력하세요..."
                class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button
                @click="handleSendMessage"
                :disabled="!chatInput.trim() || chatLoading"
                class="bg-primary-600 text-white p-3 rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Send :size="18" />
              </button>
            </div>
          </div>
        </div>

        <!-- 3. History Tab -->
        <div
          v-if="currentTab === 'history'"
          class="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide space-y-4"
        >
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
                :class="classObjectForType(item.aiType)"
              >
                {{ labelForType(item.aiType) }}
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
      </div>

      <BottomNav />

      <!-- 구독 유도 모달 -->
      <SubscriptionRequiredModal
        :is-open="isSubscriptionModalOpen"
        @close="handleCloseSubscriptionModal"
      />

      <!-- 기간별 식단 추천 모달 -->
      <PeriodMealPlanModal
        :is-open="isPeriodModalOpen"
        :loading="mealPlanLoading"
        @close="isPeriodModalOpen = false"
        @confirm="handlePeriodMealPlan"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  getPeriodFeedback,
  getMenuRecommendation,
  getAiHistory,
  getPeriodMealPlan,
  chatWithAi,
  type AiResponse,
} from '@/services/aiService'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useAiStore } from '@/stores/aiStore'
import BottomNav from '@/components/common/BottomNav.vue'
import SubscriptionRequiredModal from '@/components/common/SubscriptionRequiredModal.vue'
import PeriodMealPlanModal from '@/components/ai/PeriodMealPlanModal.vue'
import {
  ArrowLeft,
  Bot,
  Loader2,
  BarChart3,
  Utensils,
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const aiStore = useAiStore()

const {
  currentTab,
  feedbackDate,
  feedbackResult,
  recommendResult,
  selectedMealType,
  selectedFlavors,
  chatMessages,
  chatInput,
} = storeToRefs(aiStore)

const tabs = [
  { id: 'feedback', label: '기간 분석' },
  { id: 'recommend', label: '메뉴 추천' },
  { id: 'chat', label: '대화하기' },
  { id: 'history', label: '히스토리' },
]

const loading = ref(false)
// Result is now split into feedbackResult and recommendResult in store

// 구독 모달 제어
const isSubscriptionModalOpen = ref(false)

// 식단 추천 모달 제어
const isPeriodModalOpen = ref(false)
const mealPlanLoading = ref(false)

const handlePeriodMealPlan = async ({ start, end }: { start: string; end: string }) => {
  mealPlanLoading.value = true
  feedbackResult.value = '' // Clear previous result if needed, or keeping it is fine. Clearing to show "loading" or update.
  isPeriodModalOpen.value = false

  try {
    const res = await getPeriodMealPlan(start, end, selectedFlavors.value)
    feedbackResult.value = res
  } catch (e) {
    console.error(e)
    toastStore.show('식단 생성 중 오류가 발생했습니다.', 'error')
  } finally {
    mealPlanLoading.value = false
  }
}

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
const reqFeedback = async () => {
  if (!feedbackDate.value.start || !feedbackDate.value.end) {
    toastStore.show('시작일과 종료일을 선택해주세요.', 'warning')
    return
  }

  loading.value = true
  feedbackResult.value = ''

  try {
    const res = await getPeriodFeedback(feedbackDate.value.start, feedbackDate.value.end)
    feedbackResult.value = res
  } catch (e) {
    console.error(e)
    toastStore.show('분석 요청 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// Menu Recommendation
const mealTypes = ['아침', '점심', '저녁', '간식']
const flavorOptions = ['매운맛', '단맛', '짠맛', '담백한', '기름진', '상큼한', '따뜻한', '시원한']

const toggleFlavor = (flavor: string) => {
  if (selectedFlavors.value.includes(flavor)) {
    selectedFlavors.value = selectedFlavors.value.filter((f) => f !== flavor)
  } else {
    selectedFlavors.value.push(flavor)
  }
}

const reqRecommend = async () => {
  loading.value = true
  recommendResult.value = ''

  try {
    const res = await getMenuRecommendation(selectedMealType.value, selectedFlavors.value)
    recommendResult.value = res
  } catch (e) {
    console.error(e)
    toastStore.show('추천 요청 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// Chat Logic
const chatLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

interface ChatItem {
  id: string
  type: 'DATE' | 'USER' | 'AI'
  text?: string
  date?: Date
  displayTime?: string
  fullDate?: string
}

const processedMessages = computed(() => {
  const items: ChatItem[] = []
  const rawItems: { type: 'USER' | 'AI'; text: string; date: Date }[] = []

  chatMessages.value.forEach((msg) => {
    const d = new Date(msg.createdAt || Date.now())
    if (msg.question) {
      rawItems.push({ type: 'USER', text: msg.question, date: d })
    }
    if (msg.answer) {
      // AI 답변은 사용자 질문 1초 뒤로 가정 (순서 보장용)
      const aiDate = new Date(d.getTime() + 1000)
      rawItems.push({ type: 'AI', text: msg.answer, date: aiDate })
    }
  })

  // 날짜순 정렬 (오래된 게 위로)
  rawItems.sort((a, b) => a.date.getTime() - b.date.getTime())

  let lastDateStr = ''
  rawItems.forEach((item, idx) => {
    const dateStr = item.date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })

    // 날짜 변경선
    if (dateStr !== lastDateStr) {
      items.push({ id: `date-${idx}`, type: 'DATE', fullDate: dateStr })
      lastDateStr = dateStr
    }

    // 시간 표시 (오전/오후 h:mm)
    const timeStr = item.date.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    items.push({
      id: `msg-${idx}-${item.type}`,
      type: item.type,
      text: item.text,
      displayTime: timeStr,
    })
  })

  return items
})

const handleSendMessage = async () => {
  if (!chatInput.value.trim() || chatLoading.value) return

  const userMsg: AiResponse = {
    question: chatInput.value,
    createdAt: new Date().toISOString(),
    aiType: 'CHAT',
  }

  // Optimistic update
  chatMessages.value.push(userMsg)
  const messageToSend = chatInput.value
  chatInput.value = ''
  chatLoading.value = true

  // Scroll to bottom
  scrollToBottom()

  try {
    const res = await chatWithAi(messageToSend)
    const aiMsg: AiResponse = {
      answer: res,
      createdAt: new Date().toISOString(),
      aiType: 'CHAT',
    }
    chatMessages.value.push(aiMsg)
    scrollToBottom()
  } catch (e) {
    console.error(e)
    toastStore.show('메시지 전송 실패', 'error')
  } finally {
    chatLoading.value = false
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }, 100)
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
  } else if (newTab === 'chat') {
    // 채팅 탭 진입 시 히스토리 불러오기
    fetchHistory().then(() => {
      // 과거 기록을 채팅방에 로드 (중복 체크 필요)
      // historyList의 항목들이 chatMessages에 이미 있는지 확인해야 함
      // 간단하게: chatMessages가 비어있을 때만 로드하거나,
      // 또는 messageIds 체크. 지금은 ID가 없으므로...
      // Store를 쓰므로 chatMessages가 유지됨.
      // 만약 나갔다 들어왔는데 history를 다시 fetch하면 중복될 수 있음.
      // 따라서 chatMessages가 비어있을 때만 history를 병합하거나,
      // store에 'historyLoaded' flag를 둘 수도 있음.
      // 일단 간단히: chatMessages가 비어있으면 로드.
      if (chatMessages.value.length === 0 && historyList.value.length > 0) {
        // historyList의 모든 항목을 추가?
        // historyList는 전체 히스토리.
        // 채팅방은 'CHAT' 타입만 보여줄지, 전체 다 보여줄지?
        // 기존 코드는 map해서 다 넣었음.
        // 하지만 사용자는 '대화하기' 탭에서 이전 대화를 보고 싶어함.
        // 여기선 historyList의 'CHAT' 타입만 필터링해서 넣는 게 낫지만
        // 기존 로직 유지: map all to CHAT type (UI display hack)
        // Better: Just merge unique items? Without IDs it's hard.
        // For persistence: If store has messages, don't overwrite?
        // But if user chatted on another device? (Not scope now).
        // Let's rely on store persistence. If store has data, don't re-fetch/re-populate.
        if (chatMessages.value.length === 0) {
          chatMessages.value = historyList.value.map((h) => ({
            ...h,
            aiType: 'CHAT',
          }))
        }
      }
      nextTick(() => scrollToBottom())
    })
  } else {
    // Other tabs
  }
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

const classObjectForType = (type?: string) => {
  switch (type) {
    case 'FEEDBACK':
      return 'bg-blue-50 text-blue-600 border-blue-100'
    case 'RECOMMENDATION':
      return 'bg-green-50 text-green-600 border-green-100'
    case 'CHAT':
      return 'bg-purple-50 text-purple-600 border-purple-100'
    default:
      return 'bg-slate-50 text-slate-500 border-slate-100'
  }
}

const labelForType = (type?: string) => {
  switch (type) {
    case 'FEEDBACK':
      return '식단 분석'
    case 'RECOMMENDATION':
      return '메뉴 추천'
    case 'CHAT':
      return '자유 대화'
    default:
      return '기타'
  }
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
