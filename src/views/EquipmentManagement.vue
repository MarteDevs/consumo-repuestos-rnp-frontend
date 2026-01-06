<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api/axios';
import type { Equipment, Brand, Location } from '../types';
import Toast from '../components/Toast.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

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
    // 1. Cargar Equipos (con filtros)
    const params = new URLSearchParams();
    if (search.value) params.append('search', search.value);
    if (statusFilter.value) params.append('status', statusFilter.value);
    
    const resEq = await api.get(`/equipments?${params.toString()}`);
    equipments.value = resEq.data;

    // 2. Cargar Marcas y Ubicaciones (Solo si es la primera vez o están vacías)
    if (brands.value.length === 0) {
      const resBrands = await api.get('/products/brands'); // Reusamos el de productos
      brands.value = resBrands.data;
    }
    if (locations.value.length === 0) {
      const resLoc = await api.get('/locations');
      locations.value = resLoc.data;
    }

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
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
    if (isEditing.value) {
      // EDITAR
      await api.put(`/equipments/${form.value.id}`, form.value);
      showToast('Equipo actualizado correctamente', 'success');
    } else {
      // CREAR
      await api.post('/equipments', form.value);
      showToast('Equipo registrado correctamente', 'success');
    }
    showModal.value = false;
    loadData();
  } catch (error: any) {
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
                📍 {{ eq.locations?.name || 'Sin asignar' }}
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

      <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">{{ isEditing ? 'Editar Equipo' : 'Nuevo Equipo' }}</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Código Interno *</label>
              <input v-model="form.internal_code" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: 1011-23">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Marca *</label>
              <select v-model="form.brand_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option :value="0">Seleccione...</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Modelo *</label>
              <input v-model="form.model" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: JACK LEG">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Número de Serie</label>
              <input v-model="form.serial_number" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Opcional">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Ubicación Inicial</label>
              <select v-model="form.current_location_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option :value="0">Sin asignar...</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Estado</label>
              <select v-model="form.status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option value="OPERATIVO">OPERATIVO</option>
                <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
                <option value="BAJA">BAJA</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Horómetro Inicial (Pies)</label>
              <input 
                v-model.number="form.accumulated_feet" 
                type="number" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-gray-50" 
                :readonly="isEditing"
                title="Para modificar esto, use una Orden de Trabajo"
              >
              <p v-if="isEditing" class="text-xs text-gray-500 mt-1">El horómetro solo se actualiza mediante reportes de consumo.</p>
            </div>

          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Cancelar</button>
            <button @click="saveEquipment" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">{{ isEditing ? 'Guardar Cambios' : 'Registrar Equipo' }}</button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    @close="closeToast"
  />

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