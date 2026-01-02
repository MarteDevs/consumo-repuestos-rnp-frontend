<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api/axios';

const route = useRoute();
const order = ref<any>(null);
const loading = ref(true);

// Formateadores
const formatDate = (date: string) => new Date(date).toLocaleDateString('es-PE');
const formatCurrency = (val: number, currency: string = 'PEN') => 
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(val);

onMounted(async () => {
  try {
    const orderId = route.params.id;
    const res = await api.get(`/orders/${orderId}`);
    order.value = res.data;
  } catch (error) {
    console.error("Error cargando orden", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    
    <div v-if="loading" class="text-center py-20 text-gray-500">Cargando detalles...</div>

    <div v-else-if="order" class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
      
      <div class="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h1 class="text-xl font-bold">Orden de Trabajo #{{ order.poot_number }}</h1>
          <p class="text-sm text-gray-400">Fecha: {{ formatDate(order.order_date) }}</p>
        </div>
        <div class="text-right">
          <span :class="`px-3 py-1 rounded-full text-xs font-bold ${order.maintenance_type === 'PREVENTIVO' ? 'bg-green-500' : 'bg-yellow-500'} text-white`">
            {{ order.maintenance_type }}
          </span>
        </div>
      </div>

      <div class="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100">
        
        <div>
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos del Equipo</h3>
          
          <div class="mb-3">
            <p class="text-2xl font-bold text-gray-800 leading-none">{{ order.equipment?.internal_code }}</p>
            <p class="text-sm text-gray-500">{{ order.equipment?.model }}</p>
            <p class="text-xs text-gray-400 mt-1">S/N: {{ order.equipment?.serial_number || 'No registrado' }}</p>
          </div>

          <div class="space-y-2 bg-gray-50 p-2 rounded text-sm">
<!--             <div class="flex items-start">
              <span class="mr-2 text-gray-400">🏗️</span>
              <div>
                <span class="text-gray-500 text-xs block">Ubic. Actual Equipo:</span>
                <span class="font-medium text-gray-700">
                  {{ order.equipment?.locations?.name || 'Desconocida' }}
                </span>
              </div>
            </div> -->
            <div class="flex items-start border-t border-gray-200 pt-2">
              <span class="mr-2">📍</span>
              <div>
                <span class="text-gray-500 text-xs block">Área de Destino:</span>
                <span class="font-bold text-indigo-700">
                  {{ order.location?.name || 'Sin destino' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Responsable</h3>
          <div class="mb-3">
            <p class="text-xs text-gray-500">Mecánico:</p>
            <p class="text-sm font-semibold text-gray-900">{{ order.mechanic?.full_name || '---' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Supervisor:</p>
            <p class="text-sm font-semibold text-gray-900">{{ order.supervisor?.full_name || '---' }}</p>
          </div>
        </div>

        <div>
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horómetros (Pies)</h3>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-500">Anterior:</span>
            <span class="font-mono font-medium">{{ order.meter_reading_previous }}</span>
          </div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-500">Actual:</span>
            <span class="font-mono font-medium">{{ order.meter_reading_current }}</span>
          </div>
          <div class="flex justify-between text-sm border-t pt-1 mt-1">
            <span class="text-gray-500">Diferencia:</span>
            <span class="font-bold text-green-600">+{{ Number(order.meter_reading_current) - Number(order.meter_reading_previous) }}</span>
          </div>
        </div>

      </div>

      <div class="px-6 py-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Repuestos Utilizados</h3>
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Marca</th>
                <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Cant.</th>
                <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">P. Unit</th>
                <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in order.consumption_details" :key="item.id">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                  {{ item.variant?.catalog?.name || 'Item desconocido' }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {{ item.variant?.brand?.name || '-' }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                  {{ item.quantity }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                  {{ formatCurrency(Number(item.recorded_unit_price), item.recorded_currency) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-gray-900">
                  {{ formatCurrency(Number(item.total_line_cost), item.recorded_currency) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="4" class="py-4 pr-4 text-right text-sm font-bold text-gray-900">COSTO TOTAL:</td>
                <td class="py-4 px-3 text-right text-lg font-bold text-indigo-600">
                   {{ formatCurrency(order.total_cost) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
        <router-link to="/" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
          &larr; Volver al Historial
        </router-link>
        <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm" onclick="window.print()">
          🖨️ Imprimir
        </button>
      </div>

    </div>
    
    <div v-else class="text-center py-10">
      <p class="text-red-500">No se encontró la orden.</p>
      <router-link to="/" class="text-indigo-600 underline">Volver</router-link>
    </div>

  </div>
</template>