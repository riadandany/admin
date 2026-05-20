import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "mrgames_token";
const ADMIN_KEY = "mrgames_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getAdminToken = () => localStorage.getItem(ADMIN_KEY);
export const setAdminToken = (t) => localStorage.setItem(ADMIN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_KEY);

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  const a = getAdminToken();
  if (a && (cfg.url || "").includes("/admin")) cfg.headers["X-Admin-Token"] = a;
  return cfg;
});

export default api;
