import { createRouter, createWebHistory } from 'vue-router';
import CreateOrder from '../views/CreateOrder.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CreateOrder // Hacemos que sea la página principal
    }
  ]
});

export default router;