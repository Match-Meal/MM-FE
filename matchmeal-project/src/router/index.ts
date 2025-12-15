import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import FoodDBView from '../views/FoodDBView.vue'
import FoodCreateView from '../views/FoodCreateView.vue'
import FoodDetailView from '../views/FoodDetailView.vue'
import FoodEditView from '../views/FoodEditView.vue'
import ProfileIntroView from '../views/ProfileIntroView.vue'
import ProfileFormView from '../views/ProfileFormView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SettingsView from '@/views/SettingsView.vue'
import DietMainView from '@/views/DietMainView.vue'
import DietRecordView from '@/views/DietRecordView.vue'
import DietDetailView from '@/views/DietDetailView.vue'
import CommunityMainView from '@/views/CommunityMainView.vue'
import CommunityDetailView from '@/views/CommunityDetailView.vue'
import CommunityWriteView from '@/views/CommunityWriteView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LoginView.vue'), // 편의상 랜딩/로그인을 통합
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: OAuthCallback,
    },
    {
      path: '/profile-intro',
      name: 'profile-intro',
      component: ProfileIntroView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile-form',
      name: 'profile-form',
      component: ProfileFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/food-db',
      name: 'food-db',
      component: FoodDBView,
      meta: { requiresAuth: true },
    },
    {
      path: '/food-create',
      name: 'food-create',
      component: FoodCreateView,
      meta: { requiresAuth: true },
    },
    {
      path: '/food-db/:id',
      name: 'food-detail',
      component: FoodDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/food-db/edit/:id',
      name: 'food-edit',
      component: FoodEditView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/diet',
      name: 'diet-main',
      component: DietMainView,
      meta: { requiresAuth: true },
    },
    {
      path: '/diet/record',
      name: 'diet-create',
      component: DietRecordView,
      meta: { requiresAuth: true },
    },
    {
      path: '/diet/record/:id',
      name: 'diet-edit',
      component: DietRecordView,
      meta: { requiresAuth: true },
    },
    {
      path: '/diet/detail/:id',
      name: 'diet-detail',
      component: DietDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/diet/stats',
      name: 'diet-stats',
      component: () => import('@/views/DietStatsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/community',
      name: 'community-main',
      component: CommunityMainView,
      meta: { requiresAuth: true },
    },
    {
      path: '/community/write',
      name: 'community-write',
      component: CommunityWriteView,
      meta: { requiresAuth: true },
    },
    {
      path: '/community/edit/:id',
      name: 'community-edit',
      component: CommunityWriteView,
      meta: { requiresAuth: true },
    },
    {
      path: '/community/:id',
      name: 'community-detail',
      component: CommunityDetailView,
      meta: { requiresAuth: true },
    },
  ],
})

// 네비게이션 가드(로그인 안된 사용자는 홈 접근 불가)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
