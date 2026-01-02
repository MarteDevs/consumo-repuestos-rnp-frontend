// Define la forma de un Producto que viene del buscador
export interface Product {
    id: number;
    full_name: string; // "Perno - RNP"
    price: number;
    currency: 'PEN' | 'USD';
}

// Define la forma de un Equipo
export interface Equipment {
    id: number;
    internal_code: string;
    accumulated_feet: number;
}

// Define la forma de un Item en el carrito de compras
export interface OrderItem {
    variant_id: number;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    total: number;
}

export interface Personnel {
  id: number;
  full_name: string;
  job_title: string; // 'MECANICO' | 'SUPERVISOR'
}

export interface Location {
  id: number;
  name: string;
  type: string; // 'MINA' | 'TALLER'
}


// Datos completos de una orden para el historial
export interface Order {
  id: number;
  poot_number: string;
  order_date: string;
  maintenance_type: string;
  equipment: { internal_code: string }; // Solo nos interesa el código
  mechanic: { full_name: string };
  supervisor: { full_name: string };
  total_cost: number; // El calculado en el backend
  items_count: number;
}