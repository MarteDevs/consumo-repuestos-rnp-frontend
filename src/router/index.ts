import { createRouter, createWebHistory } from 'vue-router';
// Importamos las 3 vistas
import DashboardStats from '../views/DashboardStats.vue'; // <--- NUEVO
import OrdersList from '../views/OrdersList.vue';
import CreateOrder from '../views/CreateOrder.vue';
import OrderDetail from '../views/OrderDetail.vue';
import ProductInventory from '../views/ProductInventory.vue'; // <--- NUEVO
import PersonnelManagement from '../views/PersonnelManagement.vue';
import EquipmentManagement from '../views/EquipmentManagement.vue';
import LocationManagement from '../views/LocationManagement.vue';
import ImportData from '../views/ImportData.vue';
import SearchPOOT from '../views/SearchPOOT.vue';

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
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: EquipmentManagement
    },
    {
      path: '/location',
      name: 'location',
      component: LocationManagement
    },
    {
      path: '/import',
      name: 'import',
      component: ImportData
    },
    {
      path: '/search-poot',
      name: 'search-poot',
      component: SearchPOOT
    }
  ]
});

export default router;