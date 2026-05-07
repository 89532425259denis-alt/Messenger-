import { useEffect, useState } from "react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { api, ApiError, setToken } from "@/lib/api"

type Config = {
  google_client_id: string | null
  turnstile_site_key: string | null
  app_name: string
}

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void
    onTurnstileExpired?: () => void
  }
}

export function LoginPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
    window.onTurnstileSuccess = (token: string) => setTurnstileToken(token)
    window.onTurnstileExpired = () => setTurnstileToken(null)
    return () => {
      window.onTurnstileSuccess = undefined
      window.onTurnstileExpired = undefined
    }
  }, [])

  async function handleGoogle(credential?: string) {
    if (!credential) return
    setLoading(true)
    setError(null)
    try {
      const { token } = await api.loginWithGoogle(credential, turnstileToken ?? undefined)
      setToken(token)
      navigate("/", { replace: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message
      setError(msg ?? "Ошибка входа через Google")
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
      <div className="flex w-full max-w-sm flex-col items-center gap-10 animate-fade-in">
        <Logo size="xl" />

        {config?.turnstile_site_key && (
          <div className="flex w-full justify-center">
            <div
              className="cf-turnstile"
              data-sitekey={config.turnstile_site_key}
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpired"
              data-theme="auto"
              data-size="flexible"
            />
          </div>
        )}

        {error && (
          <div className="w-full rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </div>
        )}

        {clientId ? (
          <div className="flex w-full justify-center" aria-busy={loading}>
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={(resp) => handleGoogle(resp.credential)}
                onError={() => setError("Не удалось войти через Google")}
                useOneTap={false}
                shape="pill"
                size="large"
                text="continue_with"
                theme="outline"
              />
            </GoogleOAuthProvider>
          </div>
        ) : (
          <p className="text-sm text-muted-fg">Загружаем конфигурацию…</p>
        )}
      </div>
    </main>
  )
}
