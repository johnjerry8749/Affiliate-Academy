import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api', // <-- change this to your backend URL
  withCredentials: true, // optional (only if you use cookies)
});

export default api;