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

  interface CommonResponse<T> {
    status: number;
    message: string;
    data: T;
  }

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
      // So we cast to CommonResponse to safely access potentially nested .data
      
      const listPayload = listRes.data as unknown as CommonResponse<NotificationDto[]>
      const countPayload = countRes.data as unknown as CommonResponse<number>

      // 1. 기존 로컬 상태에서 '읽음'으로 처리된 ID 목록 백업 (서버 데이터보다 우선순위 높임)
      const locallyReadIds = new Set(
        notifications.value.filter(n => n.isRead).map(n => n.notificationId)
      )

      let newItems: NotificationDto[] = []

      if (listPayload && Array.isArray(listPayload.data)) {
        newItems = listPayload.data
      } else if (Array.isArray(listPayload)) {
        newItems = listPayload
      }

      // 2. 서버 데이터에 로컬 읽음 상태 병합
      notifications.value = newItems.map(item => {
        if (locallyReadIds.has(item.notificationId)) {
          return { ...item, isRead: true }
        }
        return item
      })

      if (countPayload && typeof countPayload.data === 'number') {
        unreadCount.value = countPayload.data
      } else if (typeof countPayload === 'number') {
        unreadCount.value = countPayload
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
        console.log(str)
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

  const handleNotification = (newNoti: NotificationDto) => {
    // 리스트 최상단 추가
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

  const deleteAllNotifications = async () => {
    // Optimistic Update: 선제적 UI 반영
    const originalNotifications = [...notifications.value]
    const originalUnreadCount = unreadCount.value

    notifications.value = []
    unreadCount.value = 0
    toastStore.show('모든 알림이 삭제되었습니다.', 'success')

    try {
      await notificationService.deleteAll()
    } catch (e) {
      console.error('Failed to delete all notifications:', e)
      toastStore.show('알림 삭제 실패', 'error')
      // 실패 시 롤백
      notifications.value = originalNotifications
      unreadCount.value = originalUnreadCount
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
    deleteAllNotifications
  }
})
