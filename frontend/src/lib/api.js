import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
const API_ROOT = `${BASE}/api/v1`;

const api = axios.create({ baseURL: API_ROOT });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aq_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // token expired -> clear
      localStorage.removeItem("aq_access_token");
      localStorage.removeItem("aq_refresh_token");
    }
    return Promise.reject(err);
  }
);

export function apiError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(", ");
  return err?.message || "Something went wrong";
}

export default api;
