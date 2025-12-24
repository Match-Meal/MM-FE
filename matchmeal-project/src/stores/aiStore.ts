import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AiResponse } from '@/services/aiService'

export const useAiStore = defineStore('ai', () => {
  // UI State
  const currentTab = ref<string>('feedback')

  // Feedback Tab State
  const feedbackDate = ref({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const feedbackResult = ref('') // Store feedback result separately if needed, or share 'result'

  // Recommend Tab State
  const selectedMealType = ref('점심')
  const selectedFlavors = ref<string[]>([])
  const recommendResult = ref('')

  // Shared Result (currently the view uses a single 'result' variable for both tabs,
  // but better to separate them if we want to persist them independently,
  // OR keep one if the UI implies only one active result.
  // Creating a generic 'result' to match current implementation, but distinguishing might be better.
  // Let's stick to the view's pattern: likely one 'result' display area?
  // Actually in the view code, 'result' is displayed in both Feedback and Recommend tabs dynamically.
  // But if I switch tabs, the view clears result?
  // Found in code: "else { result.value = '' }" when switching tabs.
  // So standard behavior is clearing result on tab switch.
  // HOWEVER, the user said "contents disappear when going to other components and back".
  // So we probably want to keep the result *per tab* if possible, OR just keep the last active result.
  // Let's implement separate results for better UX, or just follow the request strictly.
  // "Last content should be maintained".
  // Let's keep a single 'activeResult' but maybe we don't clear it on tab switch if we want state?
  // Wait, the code `watch(currentTab, ... result.value = '')` explicitly clears it.
  // User wants to persist data.
  // I will refactor to have `feedbackResult` and `recommendResult` so they don't overwrite each other
  // and we don't need to clear them.

  // Chat State
  const chatMessages = ref<AiResponse[]>([])
  const chatInput = ref('')

  // Actions
  const setFeedbackResult = (res: string) => {
    feedbackResult.value = res
  }

  const setRecommendResult = (res: string) => {
    recommendResult.value = res
  }

  const addChatMessage = (msg: AiResponse) => {
    chatMessages.value.push(msg)
  }

  const clearChatInput = () => {
    chatInput.value = ''
  }

  return {
    currentTab,
    feedbackDate,
    feedbackResult,
    selectedMealType,
    selectedFlavors,
    recommendResult,
    chatMessages,
    chatInput,
    setFeedbackResult,
    setRecommendResult,
    addChatMessage,
    clearChatInput,
  }
})
