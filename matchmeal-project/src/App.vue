

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="FoodDBView,CommunityMainView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
  <ToastMessage />
</template>

<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import ToastMessage from '@/components/common/ToastMessage.vue';
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

</style>
