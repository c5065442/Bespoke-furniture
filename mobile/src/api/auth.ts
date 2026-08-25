import client, { tokenStore } from "./client";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export async function login(username: string, password: string) {
  const { data } = await client.post<{ access: string; refresh: string }>("/auth/token/", {
    username,
    password,
  });
  await tokenStore.setTokens(data.access, data.refresh);
  return data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await client.get<CurrentUser>("/auth/me/");
  return data;
}

export async function logout() {
  await tokenStore.clear();
}
