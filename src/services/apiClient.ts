const API_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const TOKEN_KEY = "smart_event_token";

export type ApiUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: "cliente" | "entregador" | "admin";
};

export type AuthResponse = {
  user: ApiUser;
  token: string;
};

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Erro ao comunicar com a API");
  }

  return payload as T;
}
