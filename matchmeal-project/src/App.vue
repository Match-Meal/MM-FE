<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="FoodDBView,CommunityMainView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
  <ToastMessage />

  <GlobalConfirmModal />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastMessage from '@/components/common/ToastMessage.vue'
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
