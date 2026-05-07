import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Copy, LogOut, Share2 } from "lucide-react"
import { AppShell } from "@/components/AppShell"
import { Avatar } from "@/components/Avatar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { api, ApiError, setToken, type Me } from "@/lib/api"

export function ProfilePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    api.me().then(setMe).catch((e) => {
      if (e instanceof ApiError && e.status === 401) {
        setToken(null)
        navigate("/login", { replace: true })
      }
    })
  }, [navigate])

  const shareLink = me ? `${window.location.origin}/u/${me.username ?? me.id}` : ""

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Назад"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center rounded-full bg-surface hover:bg-surface-2"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="logo-text text-2xl">Профиль</h1>
        <ThemeToggle />
      </header>

      {me && (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-6 text-center">
          <Avatar src={me.picture} name={me.name} size="lg" />
          <div>
            <p className="logo-text text-2xl">{me.name}</p>
            <p className="text-sm text-muted-fg">{me.email}</p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareLink).catch(() => {})
              }}
              className="flex w-full items-center justify-between gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Share2 className="size-4" />
                Ссылка на профиль
              </span>
              <span className="flex items-center gap-1 text-muted-fg">
                <Copy className="size-4" />
                <span className="truncate max-w-[140px]">{shareLink}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setToken(null)
                navigate("/login", { replace: true })
              }}
              className="flex w-full items-center gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/15"
            >
              <LogOut className="size-4" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
