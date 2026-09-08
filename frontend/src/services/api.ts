import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
// If the app is opened in a remote browser/iframe, relative requests should go to the same host/port
const isBrowserLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const baseURL = (!isBrowserLocal && envUrl?.includes('localhost')) ? '' : (envUrl || '');

export const api = axios.create({
  baseURL,
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