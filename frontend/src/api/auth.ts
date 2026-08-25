import client from "./client";

export type UserRole = "CUSTOMER" | "ADMIN" | "SALES" | "WAREHOUSE" | "DRIVER";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export async function login(username: string, password: string) {
  const { data } = await client.post<{ access: string; refresh: string }>("/auth/token/", {
    username,
    password,
  });
  localStorage.setItem("bfc_access_token", data.access);
  localStorage.setItem("bfc_refresh_token", data.refresh);
  return data;
}

export async function register(input: {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  const { data } = await client.post("/auth/register/", input);
  return data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await client.get<CurrentUser>("/auth/me/");
  return data;
}

export function logout() {
  localStorage.removeItem("bfc_access_token");
  localStorage.removeItem("bfc_refresh_token");
}
