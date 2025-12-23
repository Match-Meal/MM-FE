<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, User } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { type NotificationDto } from '@/services/notificationService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

const notificationStore = useNotificationStore()
const { sortedNotifications, unreadCount } = storeToRefs(notificationStore)
const router = useRouter()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleNotificationClick = async (noti: NotificationDto) => {
  // 1. 읽음 처리
  if (!noti.isRead) {
    await notificationStore.markAsRead(noti.notificationId)
  }

  // 2. 페이지 이동
  if (noti.relatedUrl) {
    let targetPath = noti.relatedUrl
    // relatedId가 있고, URL에 포함되어 있지 않다면 끝에 추가 (중복 방지 및 누락 방지)
    if (noti.relatedId && !targetPath.includes(String(noti.relatedId))) {
      if (!targetPath.endsWith('/')) {
        targetPath += '/'
      }
      targetPath += noti.relatedId
    }
    router.push(targetPath)
  }

  // 3. 드롭다운 닫기
  isOpen.value = false
}

const handleMarkAsReadOnly = (noti: NotificationDto) => {
  notificationStore.markAsRead(noti.notificationId)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Bell Icon Button -->
    <button
      @click.stop="toggleDropdown"
      class="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-sm relative"
    >
      <Bell :size="18" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center shadow-sm border border-white/20"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-[-3.5rem] mt-3 w-72 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100 animate-fade-in origin-top-right"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-800 text-sm">알림</h3>
            <span class="text-xs text-slate-500 font-medium" v-if="unreadCount > 0">
            {{ unreadCount }}개의 안 읽은 알림
            </span>
        </div>
        <button 
            v-if="sortedNotifications.length > 0"
            @click="notificationStore.deleteAllNotifications()"
            class="text-xs text-slate-400 hover:text-slate-600 transition underline underline-offset-2"
        >
            전체 알림 삭제
        </button>
      </div>

      <!-- List -->
      <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
        <ul v-if="sortedNotifications.length > 0">
          <li
            v-for="noti in sortedNotifications"
            :key="noti.notificationId"
            class="px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer group relative"
            :class="{ 'bg-blue-50/30': !noti.isRead, 'opacity-50': noti.isRead }"
            @click="handleNotificationClick(noti)"
          >
            <div class="flex gap-3 items-start">
              <!-- Avatar Profile -->
              <div class="relative flex-shrink-0">
                <div class="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                    <img 
                        v-if="noti.senderProfileImage"
                        :src="noti.senderProfileImage" 
                        class="w-full h-full object-cover"
                    />
                    <User v-else :size="18" class="text-slate-300" />
                </div>
                <!-- Status Dot (overlay) -->
                <div 
                    class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    :class="noti.isRead ? 'bg-slate-300' : 'bg-primary-500'"
                ></div>
              </div>

              <div class="flex-1 mt-0.5">
                <p 
                    class="text-sm mb-1 leading-snug break-words"
                    :class="{ 'font-bold text-slate-800': !noti.isRead, 'font-medium text-slate-400': noti.isRead }"
                >
                  {{ noti.content }}
                </p>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-400 font-medium">
                    {{ dayjs(noti.createdAt).fromNow() }}
                  </span>
                  <button 
                    v-if="!noti.isRead" 
                    @click.stop="handleMarkAsReadOnly(noti)"
                    class="text-[10px] text-primary-500 font-bold bg-primary-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition hover:bg-primary-100 hover:text-primary-700"
                  >
                    읽음 처리
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
        
        <!-- Empty State -->
        <div v-else class="py-12 flex flex-col items-center justify-center text-center px-4">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <Bell :size="18" />
          </div>
          <p class="text-sm text-gray-500 font-medium">새로운 알림이 없습니다</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 4px;
}
</style>
