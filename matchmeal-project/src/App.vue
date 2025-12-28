<template>
  <div class="bg-gray-100 min-h-screen flex justify-center font-sans">
    <div class="w-full max-w-[430px] h-[100dvh] bg-white relative shadow-lg flex flex-col overflow-hidden">
      <Transition name="fade" mode="out-in">
        <SplashView v-if="showSplash" key="splash" />
        
        <div v-else key="main-app" class="flex-1 flex flex-col relative overflow-hidden bg-white w-full">
          <div class="flex-1 overflow-y-auto scrollbar-hide relative flex flex-col">
            <RouterView v-slot="{ Component }">
              <KeepAlive include="FoodDBView,CommunityMainView">
                <component :is="Component" />
              </KeepAlive>
            </RouterView>
          </div>
          <BottomNav v-if="showBottomNav" />
        </div>
      </Transition>

      <!-- 메시지/모달 레이어 -->
      <ToastMessage />
      <GlobalConfirmModal />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ToastMessage from '@/components/common/ToastMessage.vue'
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue'
import SplashView from '@/components/SplashView.vue'
import BottomNav from '@/components/common/BottomNav.vue'

const route = useRoute()
const showBottomNav = computed(() => route.meta.showBottomNav === true)

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
