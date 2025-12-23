<template>
  <div class="min-h-[100dvh] bg-gray-50 flex flex-col pb-20">
    <!-- Header -->
    <header class="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
      <button @click="router.back()" class="p-2 mr-2">
        <ArrowLeft class="w-6 h-6 text-gray-700" />
      </button>
      <h1 class="text-xl font-bold text-gray-900">내 뱃지 컬렉션</h1>
    </header>

    <!-- Category Tabs -->
    <div class="bg-white mt-2 px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar border-b border-gray-100">
      <button 
        v-for="cat in categories" 
        :key="cat.key"
        @click="activeCategory = cat.key"
        :class="[
          'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
          activeCategory === cat.key 
            ? 'bg-orange-500 text-white shadow-md' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Badge Grid -->
    <main class="flex-1 p-4">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
      </div>

      <div v-else-if="currentBadges.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
        <Award class="w-12 h-12 mb-2 opacity-50" />
        <p>아직 획득한 뱃지가 없어요.</p>
      </div>

      <div v-else class="grid grid-cols-3 gap-4">
        <div 
          v-for="badge in currentBadges" 
          :key="badge.badgeId"
          class="flex flex-col items-center cursor-pointer"
          @click="openBadgeDetail(badge)"
        >
          <!-- Badge Image Circle -->
          <div 
            :class="[
              'w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-sm border-2 relative',
              badge.isAcquired ? 'bg-white border-orange-100' : 'bg-gray-100 border-gray-200'
            ]"
          >
            <!-- Real Image or Fallback Icon -->
            <img 
              v-if="badge.imageUrl" 
              :src="badge.imageUrl" 
              class="w-16 h-16 object-contain"
              :class="{ 'grayscale opacity-50': !badge.isAcquired }"
              alt="Badge"
            />
            <Award v-else class="w-10 h-10 text-gray-300" />

            <!-- Lock Icon for unacquired (Optional) -->
            <div v-if="!badge.isAcquired" class="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
              <Lock class="w-6 h-6 text-gray-400 opacity-70" />
            </div>
          </div>

          <!-- Name & Tier -->
          <span :class="['text-xs font-medium text-center line-clamp-1', badge.isAcquired ? 'text-gray-900' : 'text-gray-400']">
            {{ badge.name }}
          </span>
        </div>
      </div>
    </main>

    <!-- Badge Detail Modal -->
    <div v-if="selectedBadge" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" @click.self="closeBadgeDetail">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
        <button @click="closeBadgeDetail" class="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100">
          <X class="w-6 h-6 text-gray-400" />
        </button>

        <div class="flex flex-col items-center text-center">
          <div :class="['w-28 h-28 rounded-full flex items-center justify-center mb-4 border-4', selectedBadge.isAcquired ? 'border-orange-100 bg-orange-50' : 'border-gray-100 bg-gray-50']">
             <img 
              v-if="selectedBadge.imageUrl" 
              :src="selectedBadge.imageUrl" 
              class="w-20 h-20 object-contain"
              :class="{ 'grayscale': !selectedBadge.isAcquired }"
            />
             <Award v-else class="w-12 h-12 text-gray-300" />
          </div>

          <h3 class="text-xl font-bold text-gray-900 mb-1">{{ selectedBadge.name }}</h3>
          <p class="text-sm text-gray-500 mb-6 px-4">{{ selectedBadge.description || '목표를 달성하고 뱃지를 획득해보세요!' }}</p>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden relative">
            <div 
              class="bg-orange-500 h-full rounded-full transition-all duration-500"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="flex justify-between w-full text-xs font-medium text-gray-500 mb-6">
            <span>현재 {{ selectedBadge.currentValue }}</span>
            <span>목표 {{ selectedBadge.targetValue }}</span>
          </div>

          <button 
            @click="closeBadgeDetail"
            class="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Award, Lock, X } from 'lucide-vue-next'
import { getMyBadges, type Badge, type BadgeCategoryMap } from '@/services/badgeService'
import BottomNav from '@/components/common/BottomNav.vue'

const router = useRouter()
const loading = ref(true)
const badgesMap = ref<BadgeCategoryMap>({})
const activeCategory = ref('COMMUNITY')
const selectedBadge = ref<Badge | null>(null)

const categories = [
  { key: 'COMMUNITY', label: '커뮤니티' },
  { key: 'DIET', label: '식단' },
  { key: 'CHALLENGE', label: '챌린지' },
  { key: 'SUBSCRIPTION', label: '구독' }
]

// Current tab's badges
const currentBadges = computed(() => {
  return badgesMap.value[activeCategory.value] || []
})

const progressPercentage = computed(() => {
  if (!selectedBadge.value) return 0
  const { currentValue, targetValue } = selectedBadge.value
  if (targetValue === 0) return 0
  return Math.min(100, Math.floor((currentValue / targetValue) * 100))
})

const fetchBadges = async () => {
  loading.value = true
  // Simulate delay or real fetch
  try {
     badgesMap.value = await getMyBadges()
     // Check if active category has items, if not switch to one that has? No, community first is fine.
  } finally {
    loading.value = false
  }
}

const openBadgeDetail = (badge: Badge) => {
  selectedBadge.value = badge
}

const closeBadgeDetail = () => {
  selectedBadge.value = null
}

onMounted(() => {
  fetchBadges()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}
</style>
