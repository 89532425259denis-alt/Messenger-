import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { AppShell } from "@/components/AppShell"

export function ChatPlaceholderPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  return (
    <AppShell>
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Назад"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center rounded-full bg-surface hover:bg-surface-2"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="logo-text text-xl truncate">Чат {id}</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-surface p-10 text-center text-muted-fg">
        <MessageCircle className="size-10" aria-hidden />
        <p className="logo-text text-xl text-fg">Скоро здесь будут сообщения</p>
        <p className="max-w-sm text-sm">
          Сообщения, реакции, голосовые, медиа, опросы и геолокация — в следующей фазе.
          Пока вы видите только список чатов и каркас приложения.
        </p>
      </div>
    </AppShell>
  )
}
