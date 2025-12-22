<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { Utensils, Flame, Home, MessageCircle, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const currentPath = computed(() => route.path)

const navItems = [
  { path: '/diet', icon: Utensils, label: '식단' },
  { path: '/challenge', icon: Flame, label: '챌린지' },
  { path: '/home', icon: Home, label: '홈' },
  { path: '/community', icon: MessageCircle, label: '커뮤니티' },
  { path: '/profile', icon: User, label: 'MY' },
]
</script>

<template>
  <nav
    class="h-[80px] bg-white border-t border-slate-100 flex justify-around pb-5 pt-3 text-[10px] z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
  >
    <div
      v-for="item in navItems"
      :key="item.path"
      @click="router.push(item.path)"
      class="nav-item flex flex-col items-center justify-center cursor-pointer transition-all duration-300 w-16 rounded-xl"
      :class="
        currentPath.startsWith(item.path)
          ? 'text-primary-600 font-bold -translate-y-1'
          : 'text-slate-400 hover:text-slate-600'
      "
    >
      <component 
        :is="item.icon" 
        :size="24" 
        :stroke-width="currentPath.startsWith(item.path) ? 2.5 : 2"
        class="mb-1 transition-all"
        :class="currentPath.startsWith(item.path) ? 'fill-primary-50' : ''"
      />
      <span>{{ item.label }}</span>
    </div>
  </nav>
</template>
