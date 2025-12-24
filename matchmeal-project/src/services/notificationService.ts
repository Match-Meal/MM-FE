import apiClient from './apiClient'

// [수정] 백엔드 DTO(NotificationDto.java)와 필드명을 완전히 일치시켜야 합니다.
export interface NotificationDto {
  notificationId: number;   // id -> notificationId (★ 여기가 에러 원인!)
  receiverId: number;
  senderId?: number;
  senderName?: string;
  senderProfileImage?: string;

  notificationType: string; // type -> notificationType
  content: string;          // message -> content
  relatedId: number;
  relatedUrl: string;       // url -> relatedUrl

  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  // 내 알림 목록 조회
  getMyNotifications: async () => {
    // 백엔드의 ApiResponse 구조에 따라 .data 처리가 필요할 수 있습니다.
    // apiClient 설정에 따라 다르지만, 보통 response.data.data 형태일 수 있습니다.
    return apiClient.get<NotificationDto[]>('/notification');
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async () => {
    return apiClient.get<number>('/notification/unread-count');
  },

  // 알림 읽음 처리
  markAsRead: async (notificationId: number) => {
    // 이제 호출하는 곳에서 item.notificationId를 넘겨주면 정상 동작합니다.
    return apiClient.patch<void>(`/notification/${notificationId}/read`);
  },

  // 읽음 처리된 알림 전체 삭제
  deleteAll: async () => {
    return apiClient.delete<void>('/notification');
  },
}