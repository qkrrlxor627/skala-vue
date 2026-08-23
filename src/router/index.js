import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '@/views/WeatherHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: WeatherHomeView,
      meta: { title: '사업장 기상 현황' },
    },
    {
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      component: () => import('@/views/WeatherDetailView.vue'),
      props: true,
      meta: { title: '상세 - 사업장 기상 현황' },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/WeatherAboutView.vue'),
      meta: { title: '서비스 소개 - 사업장 기상 현황' },
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: '즐겨찾기 - 사업장 기상 현황' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '페이지를 찾을 수 없습니다 - 사업장 기상 현황' },
    },
  ],
})

router.beforeEach((to) => {
  document.title = to.meta.title ?? '사업장 기상 현황'
})

export default router
