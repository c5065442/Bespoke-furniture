import axios from "axios";
import * as SecureStore from "expo-secure-store";

// NOTE: 127.0.0.1 only works when running in a web/simulator context that
// shares the dev machine's network stack. On a physical device or the
// Android emulator, set EXPO_PUBLIC_API_BASE_URL to the dev machine's LAN
// IP (or 10.0.2.2 for the Android emulator) in mobile/.env.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const ACCESS_KEY = "bfc_driver_access_token";
const REFRESH_KEY = "bfc_driver_refresh_token";

export const tokenStore = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  setTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use(async (config) => {
  const access = await tokenStore.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
    const currentRefresh = (await tokenStore.getRefresh()) ?? refresh;
    await tokenStore.setTokens(data.access, currentRefresh);
    return data.access as string;
  } catch {
    await tokenStore.clear();
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
