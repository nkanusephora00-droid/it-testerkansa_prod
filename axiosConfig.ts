import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

// Injection automatique du token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion de la pagination (PageResponse) et des erreurs (429)
api.interceptors.response.use(
  (response) => {
    // Support universel pour la pagination Spring (PostgreSQL)
    if (response.data && response.data.content !== undefined) {
      return { ...response, data: response.data.content, _meta: response.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      // Gestion du Rate Limiting (70 req/min sur le backend)
      alert('Sécurité : Trop de tentatives de connexion. Veuillez patienter 1 minute.');
    }
    return Promise.reject(error);
  }
);

export default api;