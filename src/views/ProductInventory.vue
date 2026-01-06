<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api/axios';
import type { ProductCatalog, Brand } from '../types';

// --- ESTADO ---
const products = ref<ProductCatalog[]>([]);
const brands = ref<Brand[]>([]);
const loading = ref(true);
const searchTerm = ref('');

// Modales
const showCreateModal = ref(false);
const showPriceModal = ref(false);

// Formularios
const newProductForm = ref({ name: '', part_number: '', unit_of_measure: 'UND' });
const selectedProduct = ref<ProductCatalog | null>(null);
const priceForm = ref({ brand_id: 0, unit_price: 0, currency: 'PEN' });

// --- LÓGICA DE CARGA ---
const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/products/catalog?search=${searchTerm.value}`);
    products.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const fetchBrands = async () => {
  try {
    const res = await api.get('/products/brands');
    brands.value = res.data;
  } catch (error) { console.error(error); }
};

onMounted(() => {
  fetchProducts();
  fetchBrands();
});

// --- ACCIONES DE PRODUCTO (Crear) ---
const createProduct = async () => {
  if (!newProductForm.value.name || !newProductForm.value.part_number) return alert('Completa los datos');
  
  try {
    await api.post('/products', newProductForm.value);
    showCreateModal.value = false;
    newProductForm.value = { name: '', part_number: '', unit_of_measure: 'UND' }; // Reset
    fetchProducts(); // Recargar lista
    alert('✅ Producto creado correctamente');
  } catch (error: any) {
    alert('❌ Error: ' + (error.response?.data?.message || 'Error desconocido'));
  }
};

// --- ACCIONES DE PRECIOS (Gestionar) ---
const openPriceModal = (prod: ProductCatalog) => {
  selectedProduct.value = prod;
  priceForm.value = { brand_id: 0, unit_price: 0, currency: 'PEN' }; // Reset form
  showPriceModal.value = true;
};

const savePrice = async () => {
  if (!selectedProduct.value || priceForm.value.brand_id === 0 || priceForm.value.unit_price <= 0) {
    return alert('Selecciona marca y precio válido');
  }

  try {
    await api.post('/products/variant', {
      catalog_id: selectedProduct.value.id,
      ...priceForm.value
    });
    
    // Recargamos los productos en el fondo para actualizar la vista local
    await fetchProducts();
    
    // Actualizamos el producto seleccionado en el modal para ver el cambio inmediato
    const updated = products.value.find(p => p.id === selectedProduct.value?.id);
    if (updated) selectedProduct.value = updated;

    priceForm.value.unit_price = 0; // Limpiar precio para el siguiente
    priceForm.value.brand_id = 0;
    
  } catch (error: any) {
    alert('❌ Error guardando precio');
  }
};

const deleteVariant = async (variantId: number) => {
  if(!confirm('¿Seguro que deseas desactivar este precio?')) return;
  
  try {
    await api.delete(`/products/variant/${variantId}`);
    await fetchProducts();
    // Actualizar modal
    const updated = products.value.find(p => p.id === selectedProduct.value?.id);
    if (updated) selectedProduct.value = updated;
  } catch (error) {
    alert('Error al eliminar');
  }
};

const formatCurrency = (val: number, cur: string) => 
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: cur }).format(val);

</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">📦 Gestión de Inventario</h2>
          <p class="text-sm text-gray-500">Administra el catálogo y listas de precios por marca.</p>
        </div>
        <div class="mt-4 flex gap-3 md:mt-0">
          <router-link to="/" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Volver al Dashboard</router-link>
          <button @click="showCreateModal = true" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">+ Nuevo Producto</button>
        </div>
      </div>

      <div class="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-2">
        <input 
          v-model="searchTerm" 
          @keyup.enter="fetchProducts"
          type="text" 
          placeholder="Buscar por Nombre o N° de Parte..." 
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
        <button @click="fetchProducts" class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md font-medium text-gray-700">Buscar</button>
      </div>

      <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Parte</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">U.M.</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variantes (Precios)</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="prod in products" :key="prod.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{{ prod.part_number }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ prod.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{{ prod.unit_of_measure }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="flex flex-wrap gap-1">
                  <span v-for="v in prod.product_variants" :key="v.id" class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {{ v.brands?.name }}: {{ v.currency }} {{ v.unit_price }}
                  </span>
                  <span v-if="prod.product_variants.length === 0" class="text-gray-400 italic text-xs">Sin precios asignados</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openPriceModal(prod)" class="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1 rounded">
                  Gestionar Precios
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0 && !loading">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">No se encontraron productos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showCreateModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Nuevo Producto (Catálogo)</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">N° Parte (Código)</label>
              <input v-model="newProductForm.part_number" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: 101-555">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Nombre / Descripción</label>
              <input v-model="newProductForm.name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Ej: Filtro de Aire Primario">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Unidad de Medida</label>
              <select v-model="newProductForm.unit_of_measure" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                <option value="UND">Unidad (UND)</option>
                <option value="JGO">Juego (JGO)</option>
                <option value="GLN">Galón (GLN)</option>
                <option value="KG">Kilo (KG)</option>
              </select>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showCreateModal = false" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Cancelar</button>
            <button @click="createProduct" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors">Guardar Producto</button>
          </div>
        </div>
      </div>

      <div v-if="showPriceModal && selectedProduct" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h3 class="text-lg font-bold text-gray-900">Precios: {{ selectedProduct.name }}</h3>
          <p class="text-sm text-gray-500 mb-6">N° Parte: {{ selectedProduct.part_number }}</p>

          <div class="bg-gray-50 rounded-md border border-gray-200 mb-6 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Marca</th>
                  <th class="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Precio</th>
                  <th class="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="v in selectedProduct.product_variants" :key="v.id">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ v.brands?.name }}</td>
                  <td class="px-4 py-2 text-sm text-right font-medium">{{ v.currency }} {{ v.unit_price }}</td>
                  <td class="px-4 py-2 text-right">
                    <button @click="deleteVariant(v.id)" class="text-red-600 hover:text-red-900 text-xs font-bold">Desactivar</button>
                  </td>
                </tr>
                <tr v-if="selectedProduct.product_variants.length === 0">
                  <td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500">No hay precios registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-indigo-50 p-4 rounded-md border border-indigo-100">
            <h4 class="text-sm font-bold text-indigo-900 mb-2">Agregar / Actualizar Precio</h4>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div class="sm:col-span-1">
                <label class="block text-xs font-medium text-gray-500 mb-1">Marca</label>
                <select v-model="priceForm.brand_id" class="block w-full rounded border-gray-300 text-sm border p-1.5">
                  <option :value="0">Seleccione...</option>
                  <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
              </div>
              <div class="sm:col-span-1">
                <label class="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
                <select v-model="priceForm.currency" class="block w-full rounded border-gray-300 text-sm border p-1.5">
                  <option value="PEN">Soles (S/.)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
              <div class="sm:col-span-1">
                <label class="block text-xs font-medium text-gray-500 mb-1">Precio Unit.</label>
                <input v-model.number="priceForm.unit_price" type="number" step="0.01" class="block w-full rounded border-gray-300 text-sm border p-1.5">
              </div>
              <div class="sm:col-span-1">
                <button @click="savePrice" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors w-full text-sm">Guardar</button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button @click="showPriceModal = false" class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition-colors">Cerrar</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>