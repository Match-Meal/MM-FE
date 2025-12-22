import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'
import { notificationService, type NotificationDto } from '@/services/notificationService'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationDto[]>([])
  const unreadCount = ref(0)
  const isConnected = ref(false)
  
  const authStore = useAuthStore()
  const toastStore = useToastStore()
  
  let stompClient: Client | null = null

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  // 초기 데이터 로드
  const fetchInitialData = async () => {
    try {
      if (!authStore.user) return

      const [listRes, countRes] = await Promise.all([
        notificationService.getMyNotifications(),
        notificationService.getUnreadCount()
      ])

      // API calls return AxiosResponse. 
      // User says backend returns CommonResponse<T>. 
      // Since we typed apiClient.get<NotificationDto[]> in service, 
      // TS thinks listRes.data is NotificationDto[].
      // But actually it will be the CommonResponse object at runtime.
      // So we cast to any to safely access potentially nested .data
      
      const listData = listRes.data as any
      const countData = countRes.data as any

      if (listData && Array.isArray(listData.data)) {
        notifications.value = listData.data
      } else if (Array.isArray(listData)) {
        notifications.value = listData
      }

      if (countData && typeof countData.data === 'number') {
        unreadCount.value = countData.data
      } else if (typeof countData === 'number') {
        unreadCount.value = countData
      }

    } catch (e) {
      console.error('Failed to fetch initial notifications:', e)
    }
  }

  // WebSocket 연결
  const connect = () => {
    if (stompClient?.connected) return

    // SockJS setup
    const socket = new SockJS('http://localhost:8080/ws-stomp')
    
    stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        // Authorization header might be needed depending on security config
        Authorization: `Bearer ${authStore.token}` 
      },
      debug: (str) => {
        // console.log(str)
      },
      onConnect: () => {
        isConnected.value = true
        subscribe()
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message'])
        console.error('Additional details: ' + frame.body)
      },
      onWebSocketClose: () => {
        isConnected.value = false
      }
    })

    stompClient.activate()
  }

  const subscribe = () => {
    if (!stompClient || !stompClient.connected) return

    // 1. 전체 공지
    stompClient.subscribe('/topic/global', (message) => {
      handleNotification(JSON.parse(message.body))
    })

    // 2. 개인 알림
    // 클라이언트는 /user/queue/notifications 로 구독
    stompClient.subscribe('/user/queue/notifications', (message) => {
      handleNotification(JSON.parse(message.body))
    })
  }

  const handleNotification = (payload: any) => {
    // payload structure depends on backend sending NotificationDto
    const newNoti: NotificationDto = payload
    
    // 리스트에 추가
    notifications.value.unshift(newNoti)
    unreadCount.value++

    // Toast 표시
    toastStore.show(`새 알림: ${newNoti.content}`, 'info')
  }

  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
      isConnected.value = false
    }
  }

  const markAsRead = async (id: number) => {
    // Optimistic Update: 선제적 UI 반영
    const target = notifications.value.find(n => n.notificationId === id)
    if (target && !target.isRead) {
      target.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      // Force reactivity
      notifications.value = [...notifications.value]
    }

    try {
      await notificationService.markAsRead(id)
    } catch (e) {
      console.error('Failed to mark as read:', e)
      // 실패 시 롤백 로직이 필요하다면 여기에 추가 (현재는 생략)
    }
  }

  const deleteReadNotifications = async () => {
    // Optimistic Update: 선제적 UI 반영
    const originalNotifications = [...notifications.value]
    notifications.value = notifications.value.filter(n => !n.isRead)
    toastStore.show('읽은 알림이 삭제되었습니다.', 'success')

    try {
      await notificationService.deleteAll()
    } catch (e) {
      console.error('Failed to delete read notifications:', e)
      toastStore.show('알림 삭제 실패', 'error')
      // 실패 시 롤백
      notifications.value = originalNotifications
    }
  }

  return {
    notifications,
    sortedNotifications,
    unreadCount,
    isConnected,
    connect,
    disconnect,
    fetchInitialData,
    markAsRead,
    deleteReadNotifications
  }
})
