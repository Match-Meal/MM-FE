<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const currentPath = computed(() => route.path)

const navItems = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/diet', icon: '🍽️', label: '식단' },
  { path: '/challenge', icon: '🔥', label: '챌린지' },
  { path: '/community', icon: '💬', label: '커뮤니티' },
  { path: '/profile', icon: '👤', label: 'MY' },
]
</script>

<template>
  <nav
    class="h-[88px] bg-white border-t flex justify-around pb-6 pt-2 text-[10px] z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"
  >
    <div
      v-for="item in navItems"
      :key="item.path"
      @click="router.push(item.path)"
      class="nav-item flex flex-col items-center cursor-pointer transition w-12"
      :class="
        currentPath === item.path ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-500'
      "
    >
      <span class="text-2xl mb-1 filter drop-shadow-sm">{{ item.icon }}</span>
      {{ item.label }}
    </div>
  </nav>
</template>
