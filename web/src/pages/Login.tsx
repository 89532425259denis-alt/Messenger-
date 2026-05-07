import { useEffect, useState } from "react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { api, ApiError, setToken } from "@/lib/api"
import { ShieldCheck, Sparkles } from "lucide-react"

type Config = {
  google_client_id: string | null
  turnstile_site_key: string | null
  app_name: string
}

export function LoginPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .config()
      .then(setConfig)
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить конфигурацию"))
  }, [])

  useEffect(() => {
    if (!config?.turnstile_site_key) return
    const id = "cf-turnstile-script"
    if (document.getElementById(id)) return
    const script = document.createElement("script")
    script.id = id
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [config?.turnstile_site_key])

  useEffect(() => {
    if (!config?.turnstile_site_key) return
    ;(window as unknown as { onTurnstileSuccess?: (t: string) => void }).onTurnstileSuccess = (t: string) => {
      setTurnstileToken(t)
    }
  }, [config?.turnstile_site_key])

  async function handleCredential(credential?: string) {
    if (!credential) return
    setLoading(true)
    setError(null)
    try {
      const { token } = await api.loginWithGoogle(credential, turnstileToken ?? undefined)
      setToken(token)
      navigate("/", { replace: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message
      setError(msg ?? "Ошибка входа")
    } finally {
      setLoading(false)
    }
  }

  const clientId = config?.google_client_id

  return (
    <main className="grid min-h-full place-items-center px-6 py-10">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Logo size="xl" />
          <p className="text-muted-fg text-base">
            Мессенджер с минимализмом, стеклом и приватностью.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="glass rounded-2xl p-4 text-left">
            <ShieldCheck className="size-5 text-fg" aria-hidden />
            <p className="mt-2 font-semibold">Только живые люди</p>
            <p className="mt-1 text-muted-fg text-xs">
              Вход через Google + Turnstile отсеивают ботов.
            </p>
          </div>
          <div className="glass rounded-2xl p-4 text-left">
            <Sparkles className="size-5 text-fg" aria-hidden />
            <p className="mt-2 font-semibold">Glassmorphism</p>
            <p className="mt-1 text-muted-fg text-xs">
              Стекло, плавность и адаптив под всё.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-6">
          {!config && !error && (
            <div className="text-sm text-muted-fg">Загрузка конфигурации…</div>
          )}

          {config && !clientId && (
            <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted-fg">
              Google OAuth пока не настроен. Задайте{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-fg">GOOGLE_CLIENT_ID</code>{" "}
              в окружении API, чтобы включить вход.
            </div>
          )}

          {config?.turnstile_site_key && (
            <div
              className="cf-turnstile"
              data-sitekey={config.turnstile_site_key}
              data-callback="onTurnstileSuccess"
              data-theme="auto"
            />
          )}

          {clientId && (
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={(resp) => handleCredential(resp.credential)}
                onError={() => setError("Не удалось войти через Google")}
                useOneTap={false}
                theme="filled_black"
                shape="pill"
                size="large"
                text="continue_with"
              />
            </GoogleOAuthProvider>
          )}

          {loading && <div className="text-sm text-muted-fg">Входим…</div>}
          {error && (
            <div className="rounded-2xl bg-danger/10 px-4 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <p className="text-xs text-muted-fg">
            Продолжая, вы соглашаетесь с правилами сообщества DEVO+.
          </p>
        </div>
      </div>
    </main>
  )
}
