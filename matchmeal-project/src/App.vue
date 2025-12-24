<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center font-sans overflow-hidden">
    <!-- 전역 모바일 프레임 -->
    <div
      id="mobile-frame"
      class="relative w-[375px] h-[812px] bg-white shadow-2xl rounded-[35px] overflow-hidden border-[8px] border-slate-900 flex flex-col transition-all duration-500"
    >
      <Transition name="fade" mode="out-in">
        <SplashView v-if="showSplash" key="splash" />
        
        <div v-else key="main-app" class="flex-1 flex flex-col relative overflow-hidden bg-white">
          <RouterView v-slot="{ Component }">
            <KeepAlive include="FoodDBView,CommunityMainView">
              <component :is="Component" />
            </KeepAlive>
          </RouterView>
        </div>
      </Transition>

      <!-- 메시지/모달 레이어 (프레임 내부에 위치) -->
      <ToastMessage />
      <GlobalConfirmModal />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastMessage from '@/components/common/ToastMessage.vue'
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue'
import SplashView from '@/components/SplashView.vue'

const hasSeenSplash = sessionStorage.getItem('hasSeenSplash') === 'true'
const showSplash = ref(!hasSeenSplash)

onMounted(() => {
  if (!hasSeenSplash) {
    // 4.5초 후 스플래시 화면 숨김
    setTimeout(() => {
      showSplash.value = false
      sessionStorage.setItem('hasSeenSplash', 'true')
    }, 4500)
  }
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
