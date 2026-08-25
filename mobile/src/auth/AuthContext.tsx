import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type CurrentUser, fetchCurrentUser, login as apiLogin, logout as apiLogout } from "../api/auth";
import { tokenStore } from "../api/client";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const access = await tokenStore.getAccess();
      if (!access) {
        setLoading(false);
        return;
      }
      try {
        setUser(await fetchCurrentUser());
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(username: string, password: string) {
    await apiLogin(username, password);
    setUser(await fetchCurrentUser());
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
