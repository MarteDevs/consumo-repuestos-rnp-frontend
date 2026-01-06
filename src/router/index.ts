import { createRouter, createWebHistory } from 'vue-router';
// Importamos las 3 vistas
import DashboardStats from '../views/DashboardStats.vue'; // <--- NUEVO
import OrdersList from '../views/OrdersList.vue';
import CreateOrder from '../views/CreateOrder.vue';
import OrderDetail from '../views/OrderDetail.vue';
import ProductInventory from '../views/ProductInventory.vue'; // <--- NUEVO
import PersonnelManagement from '../views/PersonnelManagement.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardStats // <--- Ahora el home es el Dashboard
    },
    {
      path: '/list', // <--- Movimos la lista aquí
      name: 'list',
      component: OrdersList
    },
    {
      path: '/create',
      name: 'create',
      component: CreateOrder
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: OrderDetail
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: ProductInventory
    },
    {
      path: '/personnel',
      name: 'personnel',
      component: PersonnelManagement
    }
  ]
});

export default router;