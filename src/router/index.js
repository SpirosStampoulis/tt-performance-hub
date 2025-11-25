import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/matches',
    name: 'Matches',
    component: () => import('../views/MatchesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/matches/:id',
    name: 'MatchDetail',
    component: () => import('../views/MatchDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tournaments',
    name: 'Tournaments',
    component: () => import('../views/TournamentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leagues',
    name: 'LeagueManagement',
    component: () => import('../views/LeagueManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/opponents',
    name: 'Opponents',
    component: () => import('../views/OpponentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/opponents/:id',
    name: 'OpponentDetail',
    component: () => import('../views/OpponentDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/skills',
    name: 'Skills',
    component: () => import('../views/SkillsView.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe()
    
    if (to.meta.requiresAuth && !user) {
      next('/login')
    } else if (to.path === '/login' && user) {
      next('/')
    } else {
      next()
    }
  })
})

export default router

