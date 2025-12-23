import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FoodRankingItem {
  foodName: string
  eatCount: number
}

export interface RankingData {
  all: FoodRankingItem[]
  breakfast: FoodRankingItem[]
  lunch: FoodRankingItem[]
  dinner: FoodRankingItem[]
  snack: FoodRankingItem[]
}

export const useRankingStore = defineStore('ranking', () => {
  const rankingData = ref<RankingData>({
    all: [],
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  })
  
  const isConnected = ref(false)
  let eventSource: EventSource | null = null

  const connect = () => {
    if (eventSource) return

    // SSE Endpoint
    // Note: EventSource by default does not support custom headers nicely without polyfills,
    // but the requirement says standard SSE. 
    // Usually EventSource sends cookies if withCredentials is true (not standard in EventSource constructor usually, checking implementation details).
    // Standard EventSource(url, { withCredentials: true }) is supported in modern browsers.
    
    eventSource = new EventSource('http://localhost:8080/ranking/stream', { 
      withCredentials: true 
    })

    eventSource.onopen = () => {
      console.log('Ranking SSE Connected')
      isConnected.value = true
    }

    const handleMessage = (event: MessageEvent) => {
      console.log('SSE Message received:', event.data)
      try {
        const data = JSON.parse(event.data)
        rankingData.value = data
      } catch (e) {
        console.error('Failed to parse ranking data:', e)
      }
    }

    // Default 'message' event
    eventSource.onmessage = handleMessage

    // Named 'ranking' event
    eventSource.addEventListener('ranking', handleMessage)

    // Named 'ranking-update' event (Backend uses this name)
    eventSource.addEventListener('ranking-update', handleMessage)

    // Named 'connect' event (Initial handshake AND Ranking Data)
    eventSource.addEventListener('connect', (event) => {
      console.log('SSE Connect Event received. Raw Data:', event.data)
      
      if (event.data === 'connected!') {
        console.log('SSE Handshake successful')
        return
      }

      try {
        const data = JSON.parse(event.data)
        console.log('Parsed JSON data:', data)
        console.log('Has "all" property?', 'all' in data)
        console.log('Is "all" an array?', Array.isArray(data.all))

        // Validate if it has 'all' property to ensure it is ranking data
        if (data && Array.isArray(data.all)) {
           console.log('Valid ranking data found. Updating store.')
           rankingData.value = data
        } else {
           console.log('Invalid data structure. Needed { all: [] }, got:', data)
        }
      } catch (e) {
        console.warn('JSON Parse Error in connect event:', e)
        console.warn('Raw data causing error:', event.data)
      }
    })
    
    // Named 'count' event
    eventSource.addEventListener('count', handleMessage)

    eventSource.onerror = (err) => {
      console.error('Ranking SSE Error:', err)
      // Do not close immediately on error, browser sometimes retries. 
      // But if readyState is CLOSED (2), we mark disconnected.
      if (eventSource?.readyState === EventSource.CLOSED) {
        isConnected.value = false
        eventSource = null
      }
    }
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      isConnected.value = false
    }
  }

  return {
    rankingData,
    isConnected,
    connect,
    disconnect
  }
})
