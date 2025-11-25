import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/matches',
    name: 'Matches',
    component: () => import('../views/MatchesView.vue'),
  },
  {
    path: '/matches/:id',
    name: 'MatchDetail',
    component: () => import('../views/MatchDetail.vue'),
  },
  {
    path: '/tournaments',
    name: 'Tournaments',
    component: () => import('../views/TournamentsView.vue'),
  },
  {
    path: '/leagues',
    name: 'LeagueManagement',
    component: () => import('../views/LeagueManagement.vue'),
  },
  {
    path: '/opponents',
    name: 'Opponents',
    component: () => import('../views/OpponentsView.vue'),
  },
  {
    path: '/opponents/:id',
    name: 'OpponentDetail',
    component: () => import('../views/OpponentDetail.vue'),
  },
  {
    path: '/skills',
    name: 'Skills',
    component: () => import('../views/SkillsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

