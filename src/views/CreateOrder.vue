<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '../stores/orderStore';
import api from '../api/axios';
// Importamos los nuevos tipos definidos
import type { Product, Equipment, Personnel, Location } from '../types';

const route = useRoute();

// --- ESTADO ---
const store = useOrderStore();
const loading = ref(false);
const message = ref<{ text: string, type: 'success' | 'error' } | null>(null);

// Listas de Datos Maestros (Backend)
const equipments = ref<Equipment[]>([]);
const locations = ref<Location[]>([]);     // Lista de Ubicaciones
const mechanics = ref<Personnel[]>([]);    // Lista de Mecánicos
const supervisors = ref<Personnel[]>([]);  // Lista de Supervisores
const searchResults = ref<Product[]>([]);

// Función auxiliar para obtener fecha hoy en formato YYYY-MM-DD
const getTodayString = () => {
  const date = new Date();
  // Ajuste manual para zona horaria local
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Formulario Cabecera
const form = ref({
  order_date: getTodayString(), // <--- NUEVO CAMPO (Por defecto HOY)
  poot_number: '',
  equipment_id: 0,
  location_id: 0,       // Nuevo: Área de Destino
  mechanic_id: 0,       // Nuevo: Seleccionable
  supervisor_id: 0,     // Nuevo: Seleccionable
  maintenance_type: 'CORRECTIVO',
  meter_reading_previous: 0,
  meter_reading_current: 0
});

// Búsqueda de POOT histórico (solo consulta)
const pootSearchQuery = ref('');
const pootHistoricalData = ref<any[]>([]);
const showPootPreview = ref(false);
const loadingPootPreview = ref(false);

// Formulario Repuesto (Buscador)
const newItemSearch = ref('');
const selectedProduct = ref<Product | null>(null);
const newItemQuantity = ref(1);

// --- LÓGICA DE CARGA INICIAL ---
onMounted(async () => {
  try {
    // Realizamos 3 peticiones simultáneas para cargar todo rápido
    // Usamos limit=1000 para traer todos los registros necesarios
    const [resEq, resPers, resLoc] = await Promise.all([
      api.get('/equipments?limit=1000'),
      api.get('/personnel?limit=1000'),
      api.get('/locations?limit=1000')
    ]);

    // 1. Guardamos Equipos y Ubicaciones (ahora vienen en .data.data por la paginación)
    equipments.value = resEq.data.data || resEq.data;
    locations.value = resLoc.data.data || resLoc.data;

    // 2. Procesamos el Personal: Separamos Mecánicos de Supervisores
    const allPersonnel = (resPers.data.data || resPers.data) as Personnel[];
    mechanics.value = allPersonnel.filter(p => p.job_title === 'MECANICO');
    supervisors.value = allPersonnel.filter(p => p.job_title === 'SUPERVISOR');

  } catch (error) {
    console.error("Error cargando datos maestros", error);
    message.value = { text: '❌ Error conectando con el servidor. Verifica el backend.', type: 'error' };
  }

  // Cargar datos desde POOT si viene desde SearchPOOT
  if (route.query.loadPoot) {
    await loadFromPoot(String(route.query.loadPoot));
  }
});

// Autocompletar desde POOT histórico
const loadFromPoot = async (pootNumber: string) => {
  try {
    const res = await api.get(`/import/search/poot?poot=${pootNumber}`);
    const data = res.data;
    
    if (data.length === 0) {
      message.value = { text: 'No se encontraron datos para este POOT', type: 'error' };
      return;
    }

    // Autocompletar formulario
    const firstItem = data[0];
    
    // Buscar equipo por código interno
    if (firstItem.equipo) {
      const equipment = equipments.value.find(e => 
        e.internal_code?.toLowerCase().includes(firstItem.equipo.toLowerCase())
      );
      if (equipment) {
        form.value.equipment_id = equipment.id;
      }
    }

    // Tipo de mantenimiento
    if (firstItem.tipo_manten) {
      const tipo = firstItem.tipo_manten.toUpperCase();
      if (['CORRECTIVO', 'PREVENTIVO', 'RELLENADO'].includes(tipo)) {
        form.value.maintenance_type = tipo;
      }
    }

    // Área de destino
    if (firstItem.area_pedido_destino) {
      const location = locations.value.find(l => 
        l.name?.toLowerCase().includes(firstItem.area_pedido_destino.toLowerCase())
      );
      if (location) {
        form.value.location_id = location.id;
      }
    }

    // Buscar mecánico por código o nombre
    if (firstItem.cod_trabajador || firstItem.go_userid) {
      const searchTerm = (firstItem.cod_trabajador || firstItem.go_userid).toLowerCase();
      const mechanic = mechanics.value.find(m => 
        m.full_name?.toLowerCase().includes(searchTerm)
      );
      if (mechanic) {
        form.value.mechanic_id = mechanic.id;
      }
    }

    // Cargar repuestos al carrito
    store.clearItems();
    let loadedCount = 0;
    let notFoundCount = 0;
    
    for (const item of data) {
      if (item.material) {
        try {
          // Buscar por nombre del producto (primera parte antes del |)
          const searchName = item.material.split('|')[0].trim();
          const prodRes = await api.get(`/products?search=${searchName}`);
          
          if (prodRes.data && prodRes.data.length > 0) {
            const product = prodRes.data[0];
            store.addItem({
              variant_id: product.id,
              name: product.full_name || item.material,
              price: Number(item.precio_igv || product.price || 0),
              currency: item.moneda || product.currency || 'PEN',
              quantity: Number(item.cantidad || 1),
              total: Number(item.total || (Number(item.cantidad) * Number(item.precio_igv)) || 0)
            });
            loadedCount++;
          } else {
            // Si no se encuentra en el catálogo, mostrar advertencia
            console.warn(`Producto no encontrado en catálogo: ${item.material}`);
            notFoundCount++;
          }
        } catch (err) {
          console.error('Error cargando producto:', item.material, err);
          notFoundCount++;
        }
      }
    }
    
    // Mensaje informativo
    let messageText = `✅ Datos cargados desde POOT ${pootNumber}`;
    if (loadedCount > 0) {
      messageText += ` - ${loadedCount} repuestos cargados`;
    }
    if (notFoundCount > 0) {
      messageText += ` ⚠️ ${notFoundCount} productos no encontrados en catálogo`;
    }

    message.value = { 
      text: messageText, 
      type: 'success' 
    };
    
    // Scroll al inicio para ver el mensaje
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Error cargando POOT:', error);
    message.value = { text: 'Error al cargar datos del POOT', type: 'error' };
  }
};

// Buscar POOT histórico para vista previa (sin autocompletar)
const searchPootPreview = async () => {
  if (pootSearchQuery.value.length < 3) {
    pootHistoricalData.value = [];
    showPootPreview.value = false;
    return;
  }
  
  loadingPootPreview.value = true;
  try {
    const res = await api.get(`/import/search/poot?poot=${pootSearchQuery.value}`);
    pootHistoricalData.value = res.data;
    showPootPreview.value = pootHistoricalData.value.length > 0;
  } catch (error) {
    console.error('Error buscando POOT:', error);
    pootHistoricalData.value = [];
    showPootPreview.value = false;
  } finally {
    loadingPootPreview.value = false;
  }
};

// Usar datos del POOT histórico para autocompletar
const usePootData = async () => {
  if (pootHistoricalData.value.length === 0) return;
  await loadFromPoot(pootHistoricalData.value[0].poot_b);
  pootSearchQuery.value = '';
  showPootPreview.value = false;
};

// --- WATCHERS Y FUNCIONES ---

// Autocompletar Horómetros al seleccionar Equipo
watch(() => form.value.equipment_id, (newId) => {
  const eq = equipments.value.find(e => e.id === newId);
  if (eq) {
    form.value.meter_reading_previous = Number(eq.accumulated_feet);
    // Sugerimos el actual igual al anterior para facilitar la entrada
    form.value.meter_reading_current = Number(eq.accumulated_feet);
  }
});

// Buscador de productos
const handleSearch = async () => {
  if (newItemSearch.value.length < 3) {
    searchResults.value = [];
    return;
  }
  try {
    const res = await api.get(`/products?search=${newItemSearch.value}`);
    searchResults.value = res.data;
  } catch (error) {
    console.error(error);
  }
};

// Seleccionar producto de la lista
const selectProduct = (prod: Product) => {
  selectedProduct.value = prod;
  newItemSearch.value = prod.full_name;
  searchResults.value = [];
};

// Agregar al Carrito (Store)
const addToCart = () => {
  if (!selectedProduct.value || newItemQuantity.value <= 0) return;

  store.addItem({
    variant_id: selectedProduct.value.id,
    name: selectedProduct.value.full_name,
    price: Number(selectedProduct.value.price),
    currency: selectedProduct.value.currency,
    quantity: newItemQuantity.value,
    total: newItemQuantity.value * Number(selectedProduct.value.price)
  });

  // Limpiar campos pequeños
  newItemSearch.value = '';
  selectedProduct.value = null;
  newItemQuantity.value = 1;
};

// --- ENVIAR ORDEN (GUARDAR) ---
const submitOrder = async () => {
  // Validaciones completas
  if (!form.value.poot_number) {
    message.value = { text: '⚠️ Falta el N° POOT.', type: 'error' }; return;
  }
  if (form.value.location_id === 0) {
    message.value = { text: '⚠️ Selecciona el Área de Destino.', type: 'error' }; return;
  }
  if (form.value.equipment_id === 0) {
    message.value = { text: '⚠️ Selecciona un Equipo.', type: 'error' }; return;
  }
  if (form.value.mechanic_id === 0) {
    message.value = { text: '⚠️ Selecciona un Mecánico.', type: 'error' }; return;
  }
  if (form.value.supervisor_id === 0) {
    message.value = { text: '⚠️ Selecciona un Supervisor.', type: 'error' }; return;
  }
  if (store.items.length === 0) {
    message.value = { text: '⚠️ Agrega al menos un repuesto a la lista.', type: 'error' }; return;
  }
  
  loading.value = true;
  message.value = null;

  try {
    const payload = {
      ...form.value,
      items: store.items.map(i => ({
        variant_id: i.variant_id,
        quantity: i.quantity
      }))
    };

    await api.post('/orders', payload);
    
    message.value = { text: '✅ Orden creada exitosamente', type: 'success' };
    store.clearItems(); // Limpiar carrito
    form.value.poot_number = ''; // Limpiar POOT para la siguiente
    
    // Scroll al inicio para ver el mensaje
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Error de conexión';
    message.value = { text: `❌ Error: ${errorMsg}`, type: 'error' };
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            🚜 Registro de Consumo (Orden de Trabajo)
          </h2>
        </div>
      </div>
      <div class="mb-4">
        <router-link to="/" class="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
          &larr; Volver al Historial
        </router-link>
      </div>

      <div v-if="message" :class="`mb-4 p-4 rounded-md font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`">
        {{ message.text }}
      </div>

      <!-- Búsqueda de POOT Histórico -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-2 mb-3">
          <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="text-sm font-semibold text-blue-900">Consultar POOT Histórico</h3>
        </div>
        <div class="flex gap-2">
          <div class="flex-grow relative">
            <input 
              v-model="pootSearchQuery" 
              @input="searchPootPreview"
              type="text" 
              placeholder="Buscar POOT anterior (ej: 23887 o POOT|23887)" 
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
            >
            <div v-if="loadingPootPreview" class="absolute right-3 top-2.5">
              <svg class="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Tabla de datos históricos -->
        <div v-if="showPootPreview && pootHistoricalData.length > 0" class="mt-4 bg-white rounded-lg border border-blue-200 overflow-hidden">
          <div class="bg-blue-100 px-4 py-3 border-b border-blue-200">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm font-bold text-blue-900">{{ pootHistoricalData[0].poot_b }}</div>
                <div class="text-xs text-blue-700 mt-1">
                  <span class="font-medium">Equipo:</span> {{ pootHistoricalData[0].equipo }}
                </div>
                <div class="text-xs text-blue-700">
                  <span class="font-medium">Área:</span> {{ pootHistoricalData[0].area_pedido_destino }}
                </div>
              </div>
              <div class="text-xs text-blue-700">
                <span class="font-semibold">{{ pootHistoricalData.length }}</span> items
              </div>
            </div>
          </div>
          
          <div class="max-h-64 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700">Código</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700">Material</th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700">Cant.</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-700">Precio Unit.</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700">Moneda</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(item, idx) in pootHistoricalData" :key="idx" class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs text-gray-500">{{ idx + 1 }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900 font-mono">{{ item.codigo }}</td>
                  <td class="px-3 py-2 text-xs text-gray-700">{{ item.material }}</td>
                  <td class="px-3 py-2 text-xs text-center font-semibold text-gray-900">{{ item.cantidad }}</td>
                  <td class="px-3 py-2 text-xs text-right text-gray-700">{{ Number(item.precio_igv).toFixed(2) }}</td>
                  <td class="px-3 py-2 text-xs text-right font-semibold text-gray-900">
                    {{ (Number(item.cantidad) * Number(item.precio_igv)).toFixed(2) }}
                  </td>
                  <td class="px-3 py-2 text-xs text-center">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" 
                          :class="item.moneda === 'PEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'">
                      {{ item.moneda }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg mb-6 overflow-hidden border border-gray-200">
        <div class="px-6 py-6">
          <h3 class="text-base font-semibold leading-6 text-gray-900 mb-6 border-b pb-2">Información General</h3>
          
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Fecha de Orden</label>
              <div class="mt-2">
                <input 
                  v-model="form.order_date" 
                  type="date" 
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
                >
              </div>
            </div>


            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">N° POOT</label>
              <div class="mt-2">
                <input v-model="form.poot_number" type="text" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3" placeholder="Ej: 2026-001">
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Área de Destino</label>
              <div class="mt-2">
                <select v-model="form.location_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <option :value="0">Seleccione Destino...</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                    {{ loc.name }} ({{ loc.type }})
                  </option>
                </select>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Tipo Mantenimiento</label>
              <div class="mt-2">
                <select v-model="form.maintenance_type" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <option>CORRECTIVO</option>
                  <option>PREVENTIVO</option>
                  <option>RELLENADO</option>
                </select>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Equipo</label>
              <div class="mt-2">
                <select v-model="form.equipment_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <option :value="0">Seleccione Equipo...</option>
                  <option v-for="e in equipments" :key="e.id" :value="e.id">
                    {{ e.internal_code }}
                  </option>
                </select>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Horómetro Anterior</label>
              <input v-model.number="form.meter_reading_previous" type="number" readonly class="mt-2 block w-full rounded-md border-0 py-1.5 bg-gray-100 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 pl-3">
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium leading-6 text-gray-900">Horómetro Actual</label>
              <input v-model.number="form.meter_reading_current" type="number" class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3">
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium leading-6 text-gray-900">Mecánico Responsable</label>
              <div class="mt-2">
                <select v-model="form.mechanic_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <option :value="0">Seleccione Mecánico...</option>
                  <option v-for="m in mechanics" :key="m.id" :value="m.id">
                    {{ m.full_name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium leading-6 text-gray-900">Supervisor de Turno</label>
              <div class="mt-2">
                <select v-model="form.supervisor_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <option :value="0">Seleccione Supervisor...</option>
                  <option v-for="s in supervisors" :key="s.id" :value="s.id">
                    {{ s.full_name }}
                  </option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="bg-indigo-50 border border-indigo-100 shadow rounded-lg mb-6">
        <div class="px-6 py-6">
           <h3 class="text-base font-semibold leading-6 text-indigo-900 mb-4">Agregar Repuestos</h3>
           <div class="flex flex-col md:flex-row gap-4 items-end">
            
            <div class="flex-grow relative w-full">
              <label class="block text-sm font-medium leading-6 text-indigo-900">Buscar por Nombre</label>
              <input 
                v-model="newItemSearch"
                @input="handleSearch"
                type="text" 
                class="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
                placeholder="Escribe el nombre del repuesto..."
              >
              <ul v-if="searchResults.length > 0" class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <li 
                  v-for="prod in searchResults" 
                  :key="prod.id"
                  @click="selectProduct(prod)"
                  class="cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white text-gray-900 border-b border-gray-100 last:border-0"
                >
                  <span class="block font-medium">{{ prod.full_name }}</span>
                  <span class="block text-xs opacity-75">Precio Actual: {{ prod.currency }} {{ prod.price }}</span>
                </li>
              </ul>
            </div>

            <div class="w-24">
              <label class="block text-sm font-medium leading-6 text-indigo-900">Cant.</label>
              <input v-model.number="newItemQuantity" type="number" min="1" class="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3 text-center">
            </div>

            <button 
              @click="addToCart"
              class="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-[38px] mb-[1px]"
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Repuesto</th>
              <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Precio Unit.</th>
              <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Cant.</th>
              <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span class="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="(item, index) in store.items" :key="index">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ item.name }}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">{{ item.currency }} {{ item.price }}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-900">{{ item.quantity }}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-gray-900">{{ item.currency }} {{ item.total.toFixed(2) }}</td>
              <td class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button @click="store.removeItem(index)" class="text-red-600 hover:text-red-900 font-semibold">Eliminar</button>
              </td>
            </tr>
            <tr v-if="store.items.length === 0">
              <td colspan="5" class="py-12 text-center text-sm text-gray-500">
                <p>El carrito está vacío.</p>
                <p class="text-xs mt-1">Busca repuestos arriba para comenzar.</p>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="store.items.length > 0" class="bg-gray-50">
             <tr>
               <td colspan="3" class="py-3 text-right font-bold text-gray-900 pr-4">TOTAL ESTIMADO:</td>
               <td class="py-3 text-right font-bold text-indigo-700 px-3">{{ store.grandTotal.toFixed(2) }}</td>
               <td></td>
             </tr>
          </tfoot>
        </table>
      </div>

      <div class="mt-8 flex items-center justify-end gap-x-6">
        <button type="button" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">Limpiar Todo</button>
        <button 
          @click="submitOrder"
          :disabled="loading"
          class="rounded-md bg-green-600 px-8 py-3 text-base font-bold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Procesando...' : '💾 GUARDAR ORDEN' }}
        </button>
      </div>

    </div>
  </div>
</template>