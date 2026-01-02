import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Definimos qué forma tiene un item del detalle
interface OrderItem {
  variant_id: number;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  total: number;
}

export const useOrderStore = defineStore('order', () => {
  // Estado: La lista de items
  const items = ref<OrderItem[]>([]);

  // Acción: Agregar item (Evita duplicados sumando cantidad)
  const addItem = (newItem: OrderItem) => {
    const existing = items.value.find(i => i.variant_id === newItem.variant_id);
    if (existing) {
      existing.quantity += newItem.quantity;
      existing.total = existing.quantity * existing.price;
    } else {
      items.value.push(newItem);
    }
  };

  // Acción: Quitar item
  const removeItem = (index: number) => {
    items.value.splice(index, 1);
  };

  // Acción: Limpiar todo (al guardar)
  const clearItems = () => {
    items.value = [];
  };

  // Getter: Calcular total global (Opcional, para mostrar en pantalla)
  const grandTotal = computed(() => {
    return items.value.reduce((sum, item) => sum + item.total, 0);
  });

  return { items, addItem, removeItem, clearItems, grandTotal };
});