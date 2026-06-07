const BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("seen_access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("seen_refresh_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("seen_access_token", access);
  localStorage.setItem("seen_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("seen_access_token");
  localStorage.removeItem("seen_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) { clearTokens(); return null; }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
    throw new ApiError(401, "Unauthorized");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error ?? "Request failed");
  return body as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  get:    <T>(path: string)                          => request<T>(path, { method: "GET" }),
  post:   <T>(path: string, body?: unknown)          => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown)          => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string)                          => request<T>(path, { method: "DELETE" }),
};
