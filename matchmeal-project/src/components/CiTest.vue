<template>
  <div class="test-box">
    <h2>{{ title }}</h2>

    <p>현재 카운트: {{ count }}</p>

    <button @click="increment">증가시키기</button>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const count = ref(0)

const increment = () => {
  count.value++
}

</script>

<style scoped>
  .text-box {
    border: 2px solid #42b883;
    padding: 20px;
    margin: 20px;
    border-radius: 8px;
  }
</style>
