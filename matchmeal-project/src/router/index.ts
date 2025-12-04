import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import FoodDBView from '../views/FoodDBView.vue'
import FoodCreateView from '../views/FoodCreateView.vue'
import FoodDetailView from '../views/FoodDetailView.vue'
import FoodEditView from '../views/FoodEditView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LoginView.vue') // 편의상 랜딩/로그인을 통합
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: OAuthCallback
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/food-db',
      name: 'food-db',
      component: FoodDBView,
      meta: { requiresAuth: true }
    },
    {
      path: '/food-create',
      name: 'food-create',
      component: FoodCreateView,
      meta: { requiresAuth: true }
    },
    {
      path: '/food-db/:id',
      name: 'food-detail',
      component: FoodDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/food-db/edit/:id',
      name: 'food-edit',
      component: FoodEditView,
      meta: { requiresAuth: true }
    }
  ]
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