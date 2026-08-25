import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type CurrentUser, fetchCurrentUser, login as apiLogin, logout as apiLogout } from "../api/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STAFF_ROLES = new Set(["ADMIN", "SALES", "WAREHOUSE"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem("bfc_access_token"));
    if (!hasToken) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    await apiLogin(username, password);
    const me = await fetchCurrentUser();
    setUser(me);
    return me;
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  const isStaff = Boolean(user && STAFF_ROLES.has(user.role));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStaff }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
