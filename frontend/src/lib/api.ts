export const TOKEN_KEY = "techtutor_token";
export const USER_KEY = "techtutor_user";

// Di dev, "/api" di-proxy Vite ke backend (:5000). Di produksi (build/preview/PWA),
// request harus menuju backend langsung — bisa diset lewat VITE_API_BASE saat build.
const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? (import.meta.env.PROD ? "http://localhost:5000" : "/api");

export function apiUrl(path: string): string {
  if (!path.startsWith("/api")) return path;
  return API_BASE === "/api" ? path : `${API_BASE}${path}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
  profile?: {
    level: number;
    totalXp: number;
    pretestDone: boolean;
    posttestDone: boolean;
    posttestScore: number | null;
    streakDays: number;
    learningStyle: string | null;
    targetLevel: string | null;
  };
}

export function getCachedUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function cacheUser(u: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(apiUrl(path), { ...options, headers });
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event("techtutor:unauthorized"));
      throw new ApiError(401, "Sesi berakhir. Silakan masuk kembali.");
    }
    const text = await res.text();
    const body: any = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(res.status, body?.error || `Permintaan gagal (${res.status})`);
    }
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "Tidak dapat terhubung ke server.");
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};