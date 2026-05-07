import { FormEvent, useEffect, useState } from "react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { api, ApiError, setToken } from "@/lib/api"

type Config = {
  google_client_id: string | null
  turnstile_site_key: string | null
  app_name: string
}

export function RegisterPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов")
      return
    }
    if (password !== confirm) {
      setError("Пароли не совпадают")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { token } = await api.registerWithEmail(
        email.trim(),
        password,
        name.trim() || null,
        turnstileToken ?? undefined,
      )
      setToken(token)
      navigate("/", { replace: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message
      setError(msg ?? "Не удалось создать аккаунт")
    } finally {
      setLoading(false)
    }
  }

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
      <div className="flex w-full max-w-sm flex-col items-center gap-8 animate-fade-in">
        <Logo size="xl" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Регистрация</h1>
          <p className="text-muted-fg text-sm">Создайте аккаунт за минуту</p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <input
            type="text"
            autoComplete="name"
            placeholder="Имя (необязательно)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-transparent px-5 text-base text-fg placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />

          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-transparent px-5 text-base text-fg placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Пароль (минимум 8 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-transparent px-5 pr-12 text-base text-fg placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full text-muted-fg hover:text-fg"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Повторите пароль"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-transparent px-5 text-base text-fg placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />

          {config?.turnstile_site_key && (
            <div className="flex justify-center pt-1">
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
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-14 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Создаём…" : "Зарегистрироваться"}
          </button>
        </form>

        {clientId && (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full items-center gap-3 text-xs uppercase tracking-wider text-muted-fg">
              <span className="h-px flex-1 bg-border" />
              <span>или</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={(resp) => handleGoogle(resp.credential)}
                onError={() => setError("Не удалось войти через Google")}
                useOneTap={false}
                shape="pill"
                size="large"
                text="signup_with"
                theme="outline"
              />
            </GoogleOAuthProvider>
          </div>
        )}

        <p className="text-sm text-muted-fg">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-blue-500 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  )
}
