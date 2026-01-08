<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axios';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- ESTADO ---
const loaded = ref(false);
const kpi = ref({ total: 0, count: 0 });
const topEquipments = ref<any[]>([]);

// Estado para importación de Excel
const showImportModal = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadMessage = ref<{ text: string, type: 'success' | 'error' } | null>(null);

// Configuración de Gráficos (Datos vacíos iniciales)
const chartDataExpenses = ref({
  labels: [] as string[],
  datasets: [{ label: 'Gasto Mensual (S/.)', backgroundColor: '#4F46E5', data: [] as number[] }]
});

const chartDataTypes = ref({
  labels: [] as string[],
  datasets: [{ backgroundColor: ['#F59E0B', '#10B981'], data: [] as number[] }]
});

// Opciones visuales
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);

// --- CARGA DE DATOS ---
onMounted(async () => {
  try {
    const res = await api.get('/stats');
    const data = res.data;

    // 1. KPIs
    kpi.value.total = Number(data.kpi.current_month_total || 0);
    kpi.value.count = Number(data.kpi.current_month_count || 0);
    
    // 2. Gráfico Barras (Gastos por Mes)
    chartDataExpenses.value = {
      labels: data.charts.expenses_by_month.map((d: any) => d.month),
      datasets: [{
        label: 'Gasto Mensual (S/.)',
        backgroundColor: '#4F46E5', // Color Indigo
        data: data.charts.expenses_by_month.map((d: any) => Number(d.total))
      }]
    };

    // 3. Gráfico Dona (Tipos)
    chartDataTypes.value = {
      labels: data.charts.maintenance_types.map((d: any) => d.maintenance_type),
      datasets: [{
        backgroundColor: ['#EF4444', '#10B981', '#3B82F6'], // Rojo, Verde, Azul
        data: data.charts.maintenance_types.map((d: any) => d._count.id)
      }]
    };

    // 4. Top Equipos
    topEquipments.value = data.charts.top_equipments;

    loaded.value = true; // ¡Listo para renderizar!

  } catch (error) {
    console.error("Error cargando estadísticas", error);
  }
});

// Funciones para importación de Excel
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      selectedFile.value = file;
      uploadMessage.value = null;
    }
  }
};

const uploadExcel = async () => {
  if (!selectedFile.value) {
    uploadMessage.value = { text: 'Por favor selecciona un archivo Excel', type: 'error' };
    return;
  }

  uploading.value = true;
  uploadMessage.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    await api.post('/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    uploadMessage.value = { 
      text: '✅ Archivo importado exitosamente. Datos actualizados.', 
      type: 'success' 
    };
    
    selectedFile.value = null;
    
    // Recargar estadísticas después de 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Error al importar el archivo';
    uploadMessage.value = { text: `❌ ${errorMsg}`, type: 'error' };
  } finally {
    uploading.value = false;
  }
};

const closeModal = () => {
  showImportModal.value = false;
  selectedFile.value = null;
  uploadMessage.value = null;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            📊 Dashboard Gerencial
          </h2>
        </div>
        <div class="mt-4 flex flex-wrap gap-2 md:ml-4 md:mt-0">
          <button 
            @click="showImportModal = true"
            class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
          >
            📄 Importar Excel
          </button>
          <router-link to="/search-poot" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            🔍 Buscar POOT
          </router-link>
          <router-link to="/location" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            📍 Ubicaciones
          </router-link>
          <router-link to="/equipment" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            🚜 Equipos
          </router-link>
          <router-link to="/personnel" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            👷 Personal
          </router-link>
          <router-link to="/inventory" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            📦 Inventario
          </router-link>
          <router-link to="/list" class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Ver Listado Completo
          </router-link>
          <router-link to="/create" class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            + Nueva Orden
          </router-link>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="overflow-hidden rounded-lg bg-white shadow px-4 py-5 sm:p-6">
          <dt class="truncate text-sm font-medium text-gray-500">Gasto Total (Mes Actual)</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ formatCurrency(kpi.total) }}</dd>
        </div>
        <div class="overflow-hidden rounded-lg bg-white shadow px-4 py-5 sm:p-6">
          <dt class="truncate text-sm font-medium text-gray-500">Órdenes Realizadas (Mes)</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-indigo-600">{{ kpi.count }}</dd>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" v-if="loaded">
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Evolución de Costos</h3>
          <div class="h-64">
            <Bar :data="chartDataExpenses" :options="chartOptions" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Distribución por Tipo</h3>
          <div class="h-64 flex justify-center">
            <Doughnut :data="chartDataTypes" :options="chartOptions" />
          </div>
        </div>

      </div>
      <div v-else class="text-center py-10 text-gray-500">Cargando gráficos...</div>

      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg font-medium leading-6 text-gray-900">🏆 Top 5 Equipos Más Costosos</h3>
        </div>
        <ul role="list" class="divide-y divide-gray-200">
          <li v-for="(eq, index) in topEquipments" :key="index" class="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 font-bold mr-4">
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="truncate text-sm font-medium text-indigo-600">{{ eq.internal_code }}</p>
                  <p class="text-sm text-gray-500">{{ eq.model }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-gray-900">{{ formatCurrency(Number(eq.total)) }}</p>
                <p class="text-xs text-gray-400">Acumulado Histórico</p>
              </div>
            </div>
          </li>
        </ul>
      </div>

    </div>

    <!-- Modal de Importación de Excel -->
    <div v-if="showImportModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity" @click="closeModal"></div>

      <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 z-10">
          <div>
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Importar Datos desde Excel
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Selecciona un archivo Excel (.xlsx) con la hoja "Query_sep" para actualizar los datos históricos de POOT.
                </p>
              </div>
            </div>
          </div>

          <div v-if="uploadMessage" :class="`mt-4 p-3 rounded-md text-sm ${uploadMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`">
            {{ uploadMessage.text }}
          </div>

          <div class="mt-5">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Archivo Excel
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span>Seleccionar archivo</span>
                    <input type="file" class="sr-only" accept=".xlsx,.xls" @change="handleFileSelect">
                  </label>
                  <p class="pl-1">o arrastra aquí</p>
                </div>
                <p class="text-xs text-gray-500">
                  Solo archivos Excel (.xlsx, .xls)
                </p>
                <p v-if="selectedFile" class="text-sm font-medium text-green-600 mt-2">
                  ✓ {{ selectedFile.name }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button 
              @click="uploadExcel"
              :disabled="!selectedFile || uploading"
              type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploading ? 'Importando...' : '📤 Importar' }}
            </button>
            <button 
              @click="closeModal"
              :disabled="uploading"
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
</template>