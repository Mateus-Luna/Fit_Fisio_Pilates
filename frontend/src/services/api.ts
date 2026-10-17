import axios from 'axios';

function resolveBaseURL(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') {
    // Se aberto via protocolo file:// no Electron, direciona para o backend local
    if (window.location.protocol === 'file:') {
      return envUrl || 'http://127.0.0.1:3000';
    }

    // Em produção (tanto no navegador quanto no Electron carregando via http://127.0.0.1:PORT),
    // o frontend é servido diretamente pelo Express. Uma baseURL vazia ('') garante
    // que todas as requisições usem a mesma origem e porta, eliminando erros de CORS,
    // falhas de resolução de localhost (IPv4 vs IPv6) e dependência de rede externa.
    if (import.meta.env.PROD) {
      return '';
    }

    // Em desenvolvimento: se já estiver na mesma porta do backend, usar relativo
    if (envUrl && window.location.port !== '3000') {
      return envUrl;
    }

    return '';
  }

  return envUrl || '';
}

export const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fitfisio_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});