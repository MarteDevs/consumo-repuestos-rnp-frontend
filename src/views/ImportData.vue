<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const loading = ref(false);
const stats = ref<any>(null);
const message = ref<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

const loadStats = async () => {
  try {
    const res = await api.get('/import/stats');
    stats.value = res.data;
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
};

const importData = async () => {
  if (!confirm('¿Deseas importar los datos desde el archivo Excel? Esto reemplazará los datos temporales actuales.')) {
    return;
  }

  loading.value = true;
  message.value = null;

  try {
    const res = await api.post('/import/excel');
    message.value = { 
      text: res.data.message || `✅ ${res.data.total} registros importados correctamente`, 
      type: 'success' 
    };
    await loadStats();
  } catch (error: any) {
    message.value = { 
      text: error.response?.data?.message || '❌ Error al importar datos', 
      type: 'error' 
    };
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nunca';
  return new Date(dateString).toLocaleString('es-PE');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      
      <div class="mb-6">
        <router-link to="/" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
          &larr; Volver al Dashboard
        </router-link>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">📊 Importación de Datos Temporales</h2>
              <p class="text-sm text-gray-500 mt-1">Carga datos desde Excel para agilizar el llenado de órdenes</p>
            </div>
          </div>

          <div v-if="message" :class="`mb-6 p-4 rounded-md font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`">
            {{ message.text }}
          </div>

          <div class="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado de Datos Importados</h3>
            
            <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-500 mb-1">Total de Registros</div>
                <div class="text-3xl font-bold text-indigo-600">{{ stats.total_records.toLocaleString() }}</div>
              </div>
              
              <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-500 mb-1">Estado</div>
                <div class="text-lg font-semibold">
                  <span :class="`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stats.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`">
                    {{ stats.status === 'active' ? 'Activo' : 'Vacío' }}
                  </span>
                </div>
              </div>
              
              <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-500 mb-1">Última Importación</div>
                <div class="text-sm font-medium text-gray-900">{{ formatDate(stats.last_import) }}</div>
              </div>
            </div>

            <div v-else class="text-center text-gray-500 py-4">
              Cargando estadísticas...
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Información Importante</h3>
                <div class="mt-2 text-sm text-blue-700">
                  <ul class="list-disc list-inside space-y-1">
                    <li>El archivo debe estar ubicado en: <code class="bg-blue-100 px-1 rounded">temp/POOT-2025-ACTUAL.xlsx</code></li>
                    <li>Se importará la hoja llamada: <strong>Query_sep</strong></li>
                    <li>Los datos son temporales y se reemplazan en cada importación</li>
                    <li>Estos datos ayudarán a autocompletar información al crear órdenes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-center">
            <button 
              @click="importData" 
              :disabled="loading"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {{ loading ? 'Importando...' : 'Importar Datos desde Excel' }}
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
