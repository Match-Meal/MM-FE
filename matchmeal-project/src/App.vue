import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
improt axios from 'axios'

interface User {
  id: number
  email: string
  userName: string
  role: string
  picture?: string
}

<template>
  <RouterView />
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
