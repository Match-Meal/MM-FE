

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="FoodDBView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<script setup lang="ts">
  import { RouterView } from 'vue-router'
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

</style>
