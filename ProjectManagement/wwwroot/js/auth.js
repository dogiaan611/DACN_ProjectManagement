﻿// Simple JWT auth helpers for the frontend
const AUTH_STORAGE_KEY = "pm_jwt";

export function saveToken(token) {
  try { localStorage.setItem(AUTH_STORAGE_KEY, token); } catch { }
}

export function getToken() {
  try { return localStorage.getItem(AUTH_STORAGE_KEY) || ""; } catch { return ""; }
}

export function clearToken() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { }
}

export async function authFetch(input, init = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", headers.get("Accept") || "application/json");

  if (init.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const merged = { ...init, headers };
  return fetch(input, merged);
}

export async function requireAuth() {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await authFetch("/user/read", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
