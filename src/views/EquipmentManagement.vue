<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api/axios';
import type { Equipment, Brand, Location } from '../types';
import Toast from '../components/Toast.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import Pagination from '../components/Pagination.vue';

// --- ESTADO ---
const equipments = ref<Equipment[]>([]);
const brands = ref<Brand[]>([]);
const locations = ref<Location[]>([]);
const loading = ref(true);
const showModal = ref(false);
const isEditing = ref(false);

// Filtros
const search = ref('');
const statusFilter = ref('');

// Paginación
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
});

// Formulario
const form = ref({
  id: 0,
  internal_code: '',
  serial_number: '',
  model: '',
  brand_id: 0,
  current_location_id: 0,
  accumulated_feet: 0,
  status: 'OPERATIVO'
});

// Toast notifications
const toast = ref({
  show: false,
  message: '',
  type: 'info' as 'success' | 'error' | 'warning' | 'info'
});

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  toast.value = { show: true, message, type };
};

const closeToast = () => {
  toast.value.show = false;
};

// Confirm dialog
const confirmDialog = ref({
  show: false,
  message: '',
  equipmentId: 0
});

const showConfirmDelete = (id: number) => {
  confirmDialog.value = {
    show: true,
    message: '¿Seguro que deseas dar de BAJA este equipo?',
    equipmentId: id
  };
};

const handleConfirmDelete = async () => {
  confirmDialog.value.show = false;
  try {
    await api.delete(`/equipments/${confirmDialog.value.equipmentId}`);
    showToast('Equipo dado de baja correctamente', 'success');
    loadData();
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Error al dar de baja el equipo', 'error');
  }
};

const handleCancelDelete = () => {
  confirmDialog.value.show = false;
};

// --- CARGA DE DATOS ---
const loadData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (search.value) params.append('search', search.value);
    if (statusFilter.value) params.append('status', statusFilter.value);
    params.append('page', String(pagination.value.currentPage));
    params.append('limit', String(pagination.value.limit));
    
    const resEq = await api.get(`/equipments?${params.toString()}`);
    equipments.value = resEq.data.data;
    pagination.value = {
      currentPage: resEq.data.pagination.page,
      totalPages: resEq.data.pagination.totalPages,
      total: resEq.data.pagination.total,
      limit: resEq.data.pagination.limit
    };

    // Cargar Marcas y Ubicaciones (Solo si es la primera vez)
    if (brands.value.length === 0) {
      const resBrands = await api.get('/products/brands');
      brands.value = resBrands.data;
    }
    if (locations.value.length === 0) {
      const resLoc = await api.get('/locations?limit=100'); // Traer todas las ubicaciones
      locations.value = resLoc.data.data || resLoc.data;
    }

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadData();
};

onMounted(() => {
  loadData();
});

// --- ACCIONES ---

const openCreate = () => {
  isEditing.value = false;
  form.value = {
    id: 0,
    internal_code: '',
    serial_number: '',
    model: '',
    brand_id: 0,
    current_location_id: 0,
    accumulated_feet: 0,
    status: 'OPERATIVO'
  };
  showModal.value = true;
};

const openEdit = (eq: Equipment) => {
  isEditing.value = true;
  form.value = {
    id: eq.id,
    internal_code: eq.internal_code,
    serial_number: eq.serial_number || '',
    model: eq.model,
    brand_id: eq.brand_id,
    current_location_id: eq.current_location_id || 0,
    accumulated_feet: eq.accumulated_feet, // Solo lectura en el form
    status: eq.status
  };
  showModal.value = true;
};

const saveEquipment = async () => {
  if (!form.value.internal_code || !form.value.brand_id) {
    showToast('Código y Marca son obligatorios', 'warning');
    return;
  }

  try {
    // Preparar datos según sea edición o creación
    const dataToSend = {
      internal_code: form.value.internal_code,
      serial_number: form.value.serial_number || '',
      model: form.value.model,
      brand_id: Number(form.value.brand_id),
      current_location_id: form.value.current_location_id ? Number(form.value.current_location_id) : null,
      status: form.value.status,
      // accumulated_feet solo para creación, no para edición
      ...(isEditing.value ? {} : { accumulated_feet: Number(form.value.accumulated_feet) || 0 })
    };

    if (isEditing.value) {
      // EDITAR
      console.log('Enviando datos de actualización:', dataToSend);
      const response = await api.put(`/equipments/${form.value.id}`, dataToSend);
      console.log('Respuesta de actualización:', response.data);
      showToast('Equipo actualizado correctamente', 'success');
    } else {
      // CREAR
      console.log('Enviando datos de creación:', dataToSend);
      const response = await api.post('/equipments', dataToSend);
      console.log('Respuesta de creación:', response.data);
      showToast('Equipo registrado correctamente', 'success');
    }
    showModal.value = false;
    loadData();
  } catch (error: any) {
    console.error('Error completo:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    showToast(error.response?.data?.message || 'Error al guardar el equipo', 'error');
  }
};

const deleteEquipment = (id: number) => {
  showConfirmDelete(id);
};

// Utilidad para colores de estado
const getStatusClass = (status: string) => {
  if (status === 'OPERATIVO') return 'bg-green-100 text-green-800';
  if (status === 'EN_MANTENIMIENTO') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">🚜 Gestión de Equipos</h2>
          <p class="text-sm text-gray-500">Administra la flota de maquinaria, estados y ubicaciones.</p>
        </div>
        <div class="mt-4 flex gap-3 md:mt-0">
          <router-link to="/" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Volver al Dashboard</router-link>
          <button @click="openCreate" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">+ Nuevo Equipo</button>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-grow">
          <input 
            v-model="search" 
            @keyup.enter="loadData"
            type="text" 
            placeholder="Buscar por Código, Modelo o Serie..." 
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          >
        </div>
        <div class="w-full sm:w-48">
          <select v-model="statusFilter" @change="loadData" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
            <option value="">Todos los Estados</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
            <option value="BAJA">De Baja</option>
          </select>
        </div>
        <button @click="loadData" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Buscar</button>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo / Serie</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horómetro</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="eq in equipments" :key="eq.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{{ eq.internal_code }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ eq.brands?.name }} {{ eq.model }}</div>
                <div class="text-xs text-gray-500">S/N: {{ eq.serial_number || '---' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ eq.locations?.name || 'Sin asignar' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">
                {{ eq.accumulated_feet }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(eq.status)}`">
                  {{ eq.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEdit(eq)" class="text-indigo-600 hover:text-indigo-900 mr-3 font-semibold">Editar</button>
                <button v-if="eq.status !== 'BAJA'" @click="deleteEquipment(eq.id)" class="text-red-600 hover:text-red-900 font-semibold">Baja</button>
              </td>
            </tr>
            <tr v-if="equipments.length === 0 && !loading">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">No se encontraron equipos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="equipments.length > 0"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @page-change="handlePageChange"
      />

    </div>
  </div>

  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    @close="closeToast"
  />

  <!-- Modal de Crear/Editar Equipo -->
  <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity" @click="showModal = false"></div>

    <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 z-10">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900" id="modal-title">
          {{ isEditing ? 'Editar Equipo' : 'Nuevo Equipo' }}
        </h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ isEditing ? 'Modifica los datos del equipo seleccionado' : 'Registra un nuevo equipo en el sistema' }}
        </p>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Código Interno *</label>
            <input 
              v-model="form.internal_code" 
              type="text" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              placeholder="Ej: RNP-001"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Número de Serie</label>
            <input 
              v-model="form.serial_number" 
              type="text" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              placeholder="Ej: SN123456789"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Modelo *</label>
            <input 
              v-model="form.model" 
              type="text" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              placeholder="Ej: D6T"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Marca *</label>
            <select 
              v-model="form.brand_id" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            >
              <option value="0">Seleccionar marca...</option>
              <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                {{ brand.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Ubicación Actual</label>
            <select 
              v-model="form.current_location_id" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            >
              <option value="0">Sin asignar</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Estado</label>
            <select 
              v-model="form.status" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            >
              <option value="OPERATIVO">Operativo</option>
              <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
              <option value="BAJA">De Baja</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Horómetro Acumulado (pies)</label>
          <input 
            v-model.number="form.accumulated_feet" 
            type="number" 
            :readonly="isEditing"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            :class="{ 'bg-gray-100 text-gray-500': isEditing }"
            placeholder="0"
          >
          <p v-if="isEditing" class="text-xs text-gray-500 mt-1">El horómetro solo se puede actualizar desde las órdenes de trabajo</p>
        </div>
      </div>

      <div class="mt-6 flex gap-3 justify-end">
        <button 
          @click="showModal = false"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="saveEquipment"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </button>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="confirmDialog.show"
    :message="confirmDialog.message"
    title="Dar de Baja Equipo"
    confirm-text="Dar de Baja"
    cancel-text="Cancelar"
    type="danger"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
  />
</template>