<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios';

const router = useRouter();

interface Query1Record {
  id: number;
  poot_b: string | null;
  fecha: string | null;
  equipo: string | null;
  material: string | null;
  codigo: string | null;
  cantidad: number | null;
  precio_igv: number | null;
  total: number | null;
  moneda: string | null;
  area_pedido_destino: string | null;
  tipo_manten: string | null;
  cod_trabajador: string | null;
  go_userid: string | null;
  observacion: string | null;
}

const searchPoot = ref('');
const loading = ref(false);
const results = ref<Query1Record[]>([]);
const selectedPoot = ref<string | null>(null);
const message = ref<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

// Estadísticas agrupadas
const stats = ref({
  totalItems: 0,
  totalCost: 0,
  equipment: '',
  maintenanceType: '',
  area: '',
  mechanic: ''
});

const searchByPoot = async () => {
  if (!searchPoot.value.trim()) {
    message.value = { text: 'Ingresa un número POOT para buscar', type: 'info' };
    return;
  }

  loading.value = true;
  message.value = null;
  results.value = [];
  
  try {
    const res = await api.get(`/import/search/poot?poot=${searchPoot.value}`);
    results.value = res.data;
    
    if (results.value.length === 0) {
      message.value = { text: 'No se encontraron resultados para este POOT', type: 'info' };
    } else {
      selectedPoot.value = searchPoot.value;
      calculateStats();
      message.value = { text: `✅ ${results.value.length} items encontrados`, type: 'success' };
    }
  } catch (error: any) {
    message.value = { text: error.response?.data?.message || 'Error al buscar', type: 'error' };
  } finally {
    loading.value = false;
  }
};

const calculateStats = () => {
  if (results.value.length === 0) return;

  stats.value.totalItems = results.value.length;
  stats.value.totalCost = results.value.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  stats.value.equipment = results.value[0]?.equipo || 'N/A';
  stats.value.maintenanceType = results.value[0]?.tipo_manten || 'N/A';
  stats.value.area = results.value[0]?.area_pedido_destino || 'N/A';
  stats.value.mechanic = results.value[0]?.go_userid || results.value[0]?.cod_trabajador || 'N/A';
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-PE');
};

const formatCurrency = (value: number | null, currency: string | null) => {
  if (value === null) return 'N/A';
  const curr = currency || 'PEN';
  return new Intl.NumberFormat('es-PE', { 
    style: 'currency', 
    currency: curr === 'PEN' ? 'PEN' : 'USD' 
  }).format(value);
};

const clearSearch = () => {
  searchPoot.value = '';
  results.value = [];
  selectedPoot.value = null;
  message.value = null;
};

const useForNewOrder = () => {
  if (!selectedPoot.value || results.value.length === 0) {
    message.value = { text: 'No hay datos para cargar', type: 'error' };
    return;
  }

  // Navegar a CreateOrder con los datos del POOT
  router.push({
    name: 'create',
    query: {
      loadPoot: selectedPoot.value
    }
  });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="mb-6">
        <router-link to="/" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
          &larr; Volver al Dashboard
        </router-link>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 mb-6">
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">🔍 Búsqueda por POOT</h2>
              <p class="text-sm text-gray-500 mt-1">Consulta órdenes históricas del sistema</p>
            </div>
          </div>

          <div v-if="message" :class="`mb-6 p-4 rounded-md font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`">
            {{ message.text }}
          </div>

          <div class="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <div class="flex gap-3">
              <div class="flex-grow">
                <label class="block text-sm font-medium text-gray-700 mb-2">Número POOT</label>
                <input 
                  v-model="searchPoot" 
                  @keyup.enter="searchByPoot"
                  type="text" 
                  placeholder="Ej: POOT|23882 o 23882" 
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3 text-lg"
                >
              </div>
              <div class="flex items-end gap-2">
                <button 
                  @click="searchByPoot" 
                  :disabled="loading"
                  class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar
                </button>
                <button 
                  v-if="results.length > 0"
                  @click="clearSearch" 
                  class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div v-if="results.length > 0" class="bg-indigo-50 rounded-lg p-6 mb-6 border border-indigo-200">
            <h3 class="text-lg font-semibold text-indigo-900 mb-4">Resumen de la Orden: {{ selectedPoot }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white p-4 rounded-lg border border-indigo-100">
                <div class="text-sm text-gray-500 mb-1">Total Items</div>
                <div class="text-2xl font-bold text-indigo-600">{{ stats.totalItems }}</div>
              </div>
              <div class="bg-white p-4 rounded-lg border border-indigo-100">
                <div class="text-sm text-gray-500 mb-1">Costo Total</div>
                <div class="text-2xl font-bold text-green-600">S/. {{ stats.totalCost.toFixed(2) }}</div>
              </div>
              <div class="bg-white p-4 rounded-lg border border-indigo-100">
                <div class="text-sm text-gray-500 mb-1">Equipo</div>
                <div class="text-sm font-semibold text-gray-900 truncate">{{ stats.equipment }}</div>
              </div>
              <div class="bg-white p-4 rounded-lg border border-indigo-100">
                <div class="text-sm text-gray-500 mb-1">Tipo Mantenimiento</div>
                <div class="text-sm font-semibold text-gray-900">{{ stats.maintenanceType }}</div>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded-lg border border-indigo-100">
                <div class="text-xs text-gray-500 mb-1">Área Destino</div>
                <div class="text-sm font-medium text-gray-900">{{ stats.area }}</div>
              </div>
              <div class="bg-white p-3 rounded-lg border border-indigo-100">
                <div class="text-xs text-gray-500 mb-1">Responsable</div>
                <div class="text-sm font-medium text-gray-900">{{ stats.mechanic }}</div>
              </div>
            </div>
          </div>

          <!-- Tabla de resultados -->
          <div v-if="results.length > 0" class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Detalle de Repuestos ({{ results.length }} items)</h3>
              <button 
                @click="useForNewOrder"
                class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors text-sm"
              >
                📋 Usar para Nueva Orden
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Moneda</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(item, index) in results" :key="item.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-500">{{ index + 1 }}</td>
                    <td class="px-4 py-3 text-sm font-mono font-bold text-gray-900">{{ item.codigo || 'N/A' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      <div class="max-w-md">{{ item.material || 'N/A' }}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-center font-semibold text-gray-900">{{ item.cantidad || 0 }}</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-900">{{ formatCurrency(item.precio_igv, item.moneda) }}</td>
                    <td class="px-4 py-3 text-sm text-right font-bold text-gray-900">{{ formatCurrency(item.total, item.moneda) }}</td>
                    <td class="px-4 py-3 text-sm text-center">
                      <span :class="`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${item.moneda === 'PEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`">
                        {{ item.moneda || 'PEN' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
