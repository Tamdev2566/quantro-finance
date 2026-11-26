import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

// =========================================================================
// CENTRAL API LOADER STATE & SUBSCRIPTION SYSTEM
// Tracks all active HTTP requests automatically without per-call boilerplate.
// =========================================================================
let activeRequests = 0;
const loadingListeners = new Set();

export const subscribeToLoading = (listener) => {
  loadingListeners.add(listener);
  try {
    listener(activeRequests > 0);
  } catch (e) {
    console.error('Error initializing loading listener:', e);
  }
  return () => {
    loadingListeners.delete(listener);
  };
};

export const isApiLoading = () => activeRequests > 0;

const notifyLoading = (isLoading) => {
  loadingListeners.forEach((fn) => {
    try {
      fn(isLoading);
    } catch (e) {
      console.error('Error in loading listener:', e);
    }
  });
};

const shouldSkipLoader = (config) => {
  if (!config) return false;
  if (config.skipLoader) return true;
  const url = config.url || '';
  // Skip loader for search-as-you-type autocomplete requests
  if (url.includes('/autocomplete')) return true;
  return false;
};

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'x-user': 'Finance Controller'
  }
});

// Automatic Request Interceptor: Shows loader on API call start
api.interceptors.request.use(
  (config) => {
    if (!shouldSkipLoader(config)) {
      activeRequests++;
      if (activeRequests === 1) {
        notifyLoading(true);
      }
    }
    return config;
  },
  (error) => {
    if (!shouldSkipLoader(error?.config)) {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        notifyLoading(false);
      }
    }
    return Promise.reject(error);
  }
);

// Automatic Response Interceptor: Hides loader on success OR error
api.interceptors.response.use(
  (response) => {
    if (!shouldSkipLoader(response?.config)) {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        notifyLoading(false);
      }
    }
    return response.data;
  },
  (error) => {
    if (!shouldSkipLoader(error?.config)) {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        notifyLoading(false);
      }
    }
    const msg = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

// =========================================================================
// PURE HTTP CLIENT (GET, POST, PUT, PATCH, DELETE)
// All module-specific endpoints live in frontend/src/services/*.js
// =========================================================================
export const httpClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
  setAuthUser: (user) => {
    api.defaults.headers['x-user'] = user ? `${user.name} (${user.role})` : 'Finance Controller';
  }
};

export default httpClient;
