<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api/axios';
import type { Personnel } from '../types';
import Toast from '../components/Toast.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import Pagination from '../components/Pagination.vue';

// --- ESTADO ---
const personnelList = ref<Personnel[]>([]);
const loading = ref(true);
const showModal = ref(false);
const isEditing = ref(false);

// Filtros
const search = ref('');
const roleFilter = ref('');

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
  full_name: '',
  job_title: 'MECANICO' // Valor por defecto
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
  personId: 0
});

const showConfirmDelete = (id: number) => {
  confirmDialog.value = {
    show: true,
    message: '¿Seguro que deseas desactivar a este personal?',
    personId: id
  };
};

const handleConfirmDelete = async () => {
  confirmDialog.value.show = false;
  try {
    await api.delete(`/personnel/${confirmDialog.value.personId}`);
    showToast('Personal desactivado correctamente', 'success');
    fetchPersonnel();
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Error al desactivar el personal', 'error');
  }
};

const handleCancelDelete = () => {
  confirmDialog.value.show = false;
};

// --- LÓGICA DE CARGA ---
const fetchPersonnel = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (search.value) params.append('search', search.value);
    if (roleFilter.value) params.append('role', roleFilter.value);
    params.append('page', String(pagination.value.currentPage));
    params.append('limit', String(pagination.value.limit));

    const res = await api.get(`/personnel?${params.toString()}`);
    personnelList.value = res.data.data;
    pagination.value = {
      currentPage: res.data.pagination.page,
      totalPages: res.data.pagination.totalPages,
      total: res.data.pagination.total,
      limit: res.data.pagination.limit
    };
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchPersonnel();
};

onMounted(() => {
  fetchPersonnel();
});

// --- ACCIONES DEL FORMULARIO ---

// Abrir modal para CREAR
const openCreate = () => {
  isEditing.value = false;
  form.value = { id: 0, full_name: '', job_title: 'MECANICO' };
  showModal.value = true;
};

// Abrir modal para EDITAR
const openEdit = (person: Personnel) => {
  isEditing.value = true;
  // Copiamos los datos para no modificarlos directo en la tabla
  form.value = { 
    id: person.id, 
    full_name: person.full_name, 
    job_title: person.job_title 
  };
  showModal.value = true;
};

// Guardar (Crear o Actualizar)
const savePersonnel = async () => {
  if (!form.value.full_name) {
    showToast('El nombre es obligatorio', 'warning');
    return;
  }

  try {
    if (isEditing.value) {
      // EDITAR (PUT)
      await api.put(`/personnel/${form.value.id}`, form.value);
      showToast('Personal actualizado correctamente', 'success');
    } else {
      // CREAR (POST)
      await api.post('/personnel', form.value);
      showToast('Personal registrado correctamente', 'success');
    }
    
    showModal.value = false;
    fetchPersonnel(); // Recargar lista
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Error al guardar el personal', 'error');
  }
};

// Eliminar (DELETE)
const deletePersonnel = async (id: number) => {
  showConfirmDelete(id);
};

// Clase dinámica para las etiquetas de cargo
const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'SUPERVISOR': return 'bg-purple-100 text-purple-800';
    case 'MECANICO': return 'bg-blue-100 text-blue-800';
    case 'ADMINISTRADOR': return 'bg-gray-100 text-gray-800';
    default: return 'bg-green-100 text-green-800';
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">👷 Gestión de Personal</h2>
          <p class="text-sm text-gray-500">Administra mecánicos, supervisores y operadores.</p>
        </div>
        <div class="mt-4 flex gap-3 md:mt-0">
          <router-link to="/" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Volver al Dashboard</router-link>
          <button @click="openCreate" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">+ Nuevo Personal</button>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-grow">
          <input 
            v-model="search" 
            @keyup.enter="fetchPersonnel"
            type="text" 
            placeholder="Buscar por nombre..." 
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          >
        </div>
        <div class="w-full sm:w-48">
          <select v-model="roleFilter" @change="fetchPersonnel" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
            <option value="">Todos los Cargos</option>
            <option value="MECANICO">Mecánicos</option>
            <option value="SUPERVISOR">Supervisores</option>
            <option value="OPERADOR">Operadores</option>
          </select>
        </div>
        <button @click="fetchPersonnel" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Buscar</button>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="person in personnelList" :key="person.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{{ person.full_name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(person.job_title)}`">
                  {{ person.job_title }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEdit(person)" class="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Editar</button>
                <button @click="deletePersonnel(person.id)" class="text-red-600 hover:text-red-900 font-semibold">Desactivar</button>
              </td>
            </tr>
            <tr v-if="personnelList.length === 0 && !loading">
              <td colspan="3" class="px-6 py-10 text-center text-gray-500">No se encontró personal activo.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="personnelList.length > 0"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @page-change="handlePageChange"
      />

      <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            {{ isEditing ? 'Editar Personal' : 'Nuevo Personal' }}
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input v-model="form.full_name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: JUAN PEREZ">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Cargo / Puesto</label>
              <select v-model="form.job_title" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option value="MECANICO">MECÁNICO</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="OPERADOR">OPERADOR</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Cancelar</button>
            <button @click="savePersonnel" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">
              {{ isEditing ? 'Guardar Cambios' : 'Registrar' }}
            </button>
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
    title="Desactivar Personal"
    confirm-text="Desactivar"
    cancel-text="Cancelar"
    type="danger"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
  />
</template>