<template>
  <Transition name="fade">
    <SplashView v-if="showSplash" />
  </Transition>

  <template v-if="!showSplash">
    <RouterView v-slot="{ Component }">
      <KeepAlive include="FoodDBView,CommunityMainView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
    <ToastMessage />
    <GlobalConfirmModal />
  </template>
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
