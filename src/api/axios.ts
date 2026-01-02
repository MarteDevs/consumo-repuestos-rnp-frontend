import axios from 'axios';

// Creamos la instancia
const api = axios.create({
    // import.meta.env es la forma en que Vite lee el archivo .env
    baseURL: import.meta.env.VITE_API_URL, 
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor (Opcional pero recomendado para debugging)
// Esto imprimirá en la consola del navegador cualquier error de conexión
api.interceptors.response.use(
    response => response,
    error => {
        console.error("❌ Error API:", error.response?.data?.message || error.message);
        return Promise.reject(error);
    }
);

export default api;