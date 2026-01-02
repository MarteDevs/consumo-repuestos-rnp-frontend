import { createRouter, createWebHistory } from 'vue-router';
import CreateOrder from '../views/CreateOrder.vue';
import OrdersList from '../views/OrdersList.vue'; // <--- Importar nueva vista

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: OrdersList // <--- Ahora el Home es la lista
    },
    {
      path: '/create',
      name: 'create',
      component: CreateOrder // <--- Movemos el registro aquí
    }
  ]
});

export default router;