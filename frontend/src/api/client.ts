import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const access = localStorage.getItem("bfc_access_token");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("bfc_refresh_token");
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
    localStorage.setItem("bfc_access_token", data.access);
    return data.access as string;
  } catch {
    localStorage.removeItem("bfc_access_token");
    localStorage.removeItem("bfc_refresh_token");
    return null;
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
