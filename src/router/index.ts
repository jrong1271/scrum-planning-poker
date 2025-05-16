import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoomView from '../views/RoomView.vue'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/room/:id?',
      name: 'room',
      component: RoomView,
      beforeEnter: (to, from, next) => {
        const userStore = useUserStore()
        // If no user data, redirect to home
        if (!userStore.userName || !userStore.action) {
          // Extract roomId from URL if present
          if (to.params.id) {
            userStore.setUserState({ roomId: to.params.id as string })
          }
          next('/')
        } else {
          next()
        }
      },
    },
  ],
})

export default router
