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
        <div class="mt-4 flex md:ml-4 md:mt-0">
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
  </div>
</template>