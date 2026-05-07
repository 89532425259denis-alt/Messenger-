const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
const TOKEN_KEY = "devo-plus.token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export type Me = {
  id: string
  email: string
  name: string
  picture: string | null
  username: string | null
  created_at: string
}

export type Chat = {
  id: string
  kind: "direct" | "group" | "channel" | "saved"
  title: string
  avatar_url: string | null
  last_message_preview: string | null
  last_message_at: string | null
  unread_count: number
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      // ignore parse errors
    }
    throw new ApiError(detail, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  loginWithGoogle: (idToken: string, turnstileToken?: string) =>
    request<{ token: string; user: Me }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken, turnstile_token: turnstileToken }),
    }),
  me: () => request<Me>("/me"),
  listChats: () => request<Chat[]>("/chats"),
  config: () =>
    request<{
      google_client_id: string | null
      turnstile_site_key: string | null
      app_name: string
    }>("/config"),
}

export const apiBase = API_BASE
