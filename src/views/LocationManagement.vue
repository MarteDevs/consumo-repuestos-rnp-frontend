<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axios';
import type { Location } from '../types';
import Toast from '../components/Toast.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

// --- ESTADO ---
const locations = ref<Location[]>([]);
const loading = ref(true);
const showModal = ref(false);
const isEditing = ref(false);
const search = ref('');

// Formulario
const form = ref({
  id: 0,
  name: '',
  type: 'MINA'
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
  locationId: 0
});

const showConfirmDelete = (id: number) => {
  confirmDialog.value = {
    show: true,
    message: '¿Seguro que deseas eliminar esta ubicación?',
    locationId: id
  };
};

const handleConfirmDelete = async () => {
  confirmDialog.value.show = false;
  try {
    await api.delete(`/locations/${confirmDialog.value.locationId}`);
    showToast('Ubicación eliminada correctamente', 'success');
    fetchLocations();
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Error al eliminar la ubicación', 'error');
  }
};

const handleCancelDelete = () => {
  confirmDialog.value.show = false;
};

// --- LÓGICA ---
const fetchLocations = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/locations?search=${search.value}`);
    locations.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLocations();
});

// --- ACCIONES ---
const openCreate = () => {
  isEditing.value = false;
  form.value = { id: 0, name: '', type: 'MINA' };
  showModal.value = true;
};

const openEdit = (loc: Location) => {
  isEditing.value = true;
  form.value = { ...loc };
  showModal.value = true;
};

const saveLocation = async () => {
  if (!form.value.name) {
    showToast('El nombre es obligatorio', 'warning');
    return;
  }

  try {
    if (isEditing.value) {
      await api.put(`/locations/${form.value.id}`, form.value);
      showToast('Ubicación actualizada correctamente', 'success');
    } else {
      await api.post('/locations', form.value);
      showToast('Ubicación creada correctamente', 'success');
    }
    showModal.value = false;
    fetchLocations();
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Error al guardar la ubicación', 'error');
  }
};

const deleteLocation = (id: number) => {
  showConfirmDelete(id);
};

// Colores para las etiquetas de tipo
const getTypeClass = (type: string) => {
  switch (type) {
    case 'MINA': return 'bg-gray-800 text-white';
    case 'TALLER': return 'bg-yellow-100 text-yellow-800';
    case 'ALMACEN': return 'bg-blue-100 text-blue-800';
    case 'SUPERFICIE': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">📍 Gestión de Ubicaciones</h2>
          <p class="text-sm text-gray-500">Define las áreas de trabajo, minas, talleres y almacenes.</p>
        </div>
        <div class="mt-4 flex gap-3 md:mt-0">
          <router-link to="/" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Volver al Dashboard</router-link>
          <button @click="openCreate" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">+ Nueva Ubicación</button>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-2">
        <input 
          v-model="search" 
          @keyup.enter="fetchLocations"
          type="text" 
          placeholder="Buscar ubicación..." 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
        >
        <button @click="fetchLocations" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Buscar</button>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre del Área</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="loc in locations" :key="loc.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{{ loc.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getTypeClass(loc.type)}`">
                  {{ loc.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEdit(loc)" class="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Editar</button>
                <button @click="deleteLocation(loc.id)" class="text-red-600 hover:text-red-900 font-semibold">Eliminar</button>
              </td>
            </tr>
            <tr v-if="locations.length === 0 && !loading">
              <td colspan="3" class="px-6 py-10 text-center text-gray-500">No hay ubicaciones registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">{{ isEditing ? 'Editar Ubicación' : 'Nueva Ubicación' }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nombre del Área</label>
              <input v-model="form.name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: NIVEL 340">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tipo de Área</label>
              <select v-model="form.type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option value="MINA">MINA (Operaciones)</option>
                <option value="TALLER">TALLER (Mantenimiento)</option>
                <option value="ALMACEN">ALMACÉN</option>
                <option value="SUPERFICIE">SUPERFICIE</option>
                <option value="OFICINA">OFICINA</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Cancelar</button>
            <button @click="saveLocation" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">Guardar</button>
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
    title="Eliminar Ubicación"
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    type="danger"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
  />
</template>