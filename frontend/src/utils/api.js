import axios from 'axios';

// Production: set VITE_API_URL at build time or use same-origin (empty = relative URLs).
// Development: Vite dev server can proxy or set VITE_API_URL in .env.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      
      if (status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status === 403) {
        throw new Error('Access forbidden.');
      } else {
        throw new Error(message);
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection.');
    } else {
      // Error setting up request
      throw new Error('Request failed. Please try again.');
    }
  }
);

export const getCurrentLoad = async () => {
  try {
    const response = await api.get('/api/dashboard/current-load');
    return response.data;
  } catch (error) {
    console.error('Error fetching current load:', error);
    throw error;
  }
};

export const getForecast = async (segment = null, hours = 24) => {
  try {
    // Validate hours parameter
    const validHours = Math.max(1, Math.min(168, Math.floor(hours) || 24));
    const params = { hours: validHours };
    if (segment && typeof segment === 'string' && segment.trim()) {
      params.segment = segment.trim();
    }
    const response = await api.get('/api/dashboard/forecast', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

export const getOutageRisks = async () => {
  try {
    const response = await api.get('/api/dashboard/outage-risks');
    return response.data;
  } catch (error) {
    console.error('Error fetching outage risks:', error);
    throw error;
  }
};

export const getAlerts = async () => {
  try {
    const response = await api.get('/api/dashboard/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

export const getMaintenancePrioritization = async () => {
  try {
    const response = await api.get('/api/maintenance/prioritization');
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance prioritization:', error);
    throw error;
  }
};

export const getHistoricalLoads = async (segment = null, days = 7) => {
  try {
    // Validate days parameter
    const validDays = Math.max(1, Math.min(365, Math.floor(days) || 7));
    const params = { days: validDays };
    if (segment && typeof segment === 'string' && segment.trim()) {
      params.segment = segment.trim();
    }
    const response = await api.get('/api/historical/loads', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical loads:', error);
    throw error;
  }
};

export const initializeData = async (days = 30) => {
  try {
    // Validate days parameter
    const validDays = Math.max(1, Math.min(365, Math.floor(days) || 30));
    const response = await api.post('/api/admin/initialize-data', null, {
      params: { days: validDays },
    });
    return response.data;
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
};

