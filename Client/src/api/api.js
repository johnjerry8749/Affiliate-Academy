import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Add /api suffix if not already present
const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;

const api = axios.create({
  baseURL: apiURL,
  withCredentials: true, // optional (only if you use cookies)
});

export default api;