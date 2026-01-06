<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axios';
import type { Order } from '../types';
import Pagination from '../components/Pagination.vue';

const orders = ref<Order[]>([]);
const loading = ref(true);
const searchTerm = ref('');

// Paginación
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
});

// Función para formatear fechas (Ej: 02/01/2026)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// Cargar datos
const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchTerm.value) params.append('search', searchTerm.value);
    params.append('page', String(pagination.value.currentPage));
    params.append('limit', String(pagination.value.limit));

    const res = await api.get(`/orders?${params.toString()}`);
    orders.value = res.data.data;
    pagination.value = {
      currentPage: res.data.pagination.page,
      totalPages: res.data.pagination.totalPages,
      total: res.data.pagination.total,
      limit: res.data.pagination.limit
    };
  } catch (error) {
    console.error("Error cargando historial", error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchOrders();
};

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <router-link to="/" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm mb-2 inline-block">
            &larr; Volver al Dashboard
          </router-link>
          <h1 class="text-2xl font-bold leading-6 text-gray-900">Historial de Consumo</h1>
          <p class="mt-2 text-sm text-gray-700">Lista completa de todas las órdenes de trabajo y costos asociados.</p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <router-link 
            to="/create"
            class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Nueva Orden
          </router-link>
        </div>
      </div>

      <div class="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-2">
        <input 
          v-model="searchTerm" 
          @keyup.enter="fetchOrders"
          type="text" 
          placeholder="Buscar por N° POOT o Código de Equipo..." 
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
        <button @click="fetchOrders" class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md font-medium text-gray-700">Buscar</button>
      </div>

      <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">N° POOT</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipo</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Mecánico</th>
                    <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Repuestos</th>
                    <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Costo Total</th>
                    <th class="relative py-3.5 pl-3 pr-4 sm:pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">{{ formatDate(order.order_date) }}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{{ order.poot_number }}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-bold bg-gray-50 rounded">{{ order.equipment.internal_code }}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${order.maintenance_type === 'PREVENTIVO' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`">
                        {{ order.maintenance_type }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
  {{ order.mechanic?.full_name || 'Sin Asignar' }}
</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">{{ order.items_count }} items</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-gray-900">S/. {{ order.total_cost.toFixed(2) }}</td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <router-link 
                        :to="`/orders/${order.id}`" 
                        class="text-indigo-600 hover:text-indigo-900 font-bold"
                      >
                        Ver Detalles
                      </router-link>
                    </td>
                  </tr>
                  <tr v-if="orders.length === 0 && !loading">
                    <td colspan="8" class="text-center py-10 text-gray-500">No hay órdenes registradas aún.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-if="orders.length > 0"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @page-change="handlePageChange"
      />

    </div>
  </div>
</template>