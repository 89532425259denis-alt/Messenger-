import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  Image as ImageIcon,
  LogOut,
  Palette,
  PencilLine,
  Pin,
  Plus,
  SearchIcon,
  Trash2,
  User,
} from "lucide-react"
import { AppShell } from "@/components/AppShell"
import { ChatCard } from "@/components/ChatCard"
import { ChatListSkeleton } from "@/components/ChatListSkeleton"
import { Logo } from "@/components/Logo"
import { Menu } from "@/components/Menu"
import { SearchBar } from "@/components/SearchBar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { api, ApiError, setToken, type Chat, type Me } from "@/lib/api"
import { Avatar } from "@/components/Avatar"

export function HomePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)
  const [chats, setChats] = useState<Chat[] | null>(null)
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.me(), api.listChats()])
      .then(([u, c]) => {
        setMe(u)
        setChats(c)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setToken(null)
          navigate("/login", { replace: true })
          return
        }
        setError(e instanceof Error ? e.message : "Ошибка загрузки")
      })
  }, [navigate])

  const filtered = useMemo(() => {
    if (!chats) return []
    const q = query.trim().toLowerCase()
    if (!q) return chats
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.last_message_preview ?? "").toLowerCase().includes(q),
    )
  }, [chats, query])

  function handleLogout() {
    setToken(null)
    navigate("/login", { replace: true })
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3">
        <Logo size="lg" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {me && (
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Профиль"
            >
              <Avatar src={me.picture} name={me.name} size="sm" />
            </button>
          )}
        </div>
      </header>

      <div className="relative">
        <SearchBar
          value={query}
          onChange={setQuery}
          onMenu={() => setMenuOpen((v) => !v)}
          placeholder="поиск..."
        />
        {menuOpen && (
          <Menu
            onClose={() => setMenuOpen(false)}
            items={[
              { label: "Новый чат", icon: PencilLine, onSelect: () => {} },
              { label: "Поиск пользователей", icon: SearchIcon, onSelect: () => {} },
              { label: "Уведомления", icon: Bell, onSelect: () => {} },
              { label: "Сменить обои", icon: Palette, onSelect: () => {} },
              { label: "Закреплённые", icon: Pin, onSelect: () => {} },
              { label: "Профиль", icon: User, onSelect: () => navigate("/profile") },
              { label: "Выйти", icon: LogOut, destructive: true, onSelect: handleLogout },
            ]}
          />
        )}
      </div>

      <section
        aria-label="Список чатов"
        className="relative flex-1 overflow-hidden"
      >
        <div className="scroll-fade-y h-full overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-3 pb-24 pt-2">
            {error && (
              <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {chats === null && <ChatListSkeleton />}

            {chats && filtered.length === 0 && (
              <EmptyState query={query} />
            )}

            {filtered.map((chat) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                onClick={() => navigate(`/chat/${chat.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <button
        type="button"
        aria-label="Новый чат"
        onClick={() => {}}
        className="fixed bottom-6 right-6 grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-glass dark:shadow-glass-dark transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-6" />
      </button>
    </AppShell>
  )
}

function EmptyState({ query }: { query: string }) {
  if (query) {
    return (
      <div className="grid place-items-center rounded-3xl bg-surface p-10 text-center text-muted-fg">
        <SearchIcon className="size-8 text-muted-fg" aria-hidden />
        <p className="mt-3 font-semibold text-fg">Ничего не найдено</p>
        <p className="mt-1 text-sm">Попробуйте изменить запрос «{query}».</p>
      </div>
    )
  }
  return (
    <div className="grid place-items-center rounded-3xl bg-surface p-10 text-center text-muted-fg">
      <PencilLine className="size-8 text-muted-fg" aria-hidden />
      <p className="mt-3 font-semibold text-fg">Здесь пока пусто</p>
      <p className="mt-1 max-w-sm text-sm">
        Начните новый чат, создайте канал или сообщество. Сообщения с самим собой уже
        ждут вас в «Избранном».
      </p>
      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg"
      >
        <Plus className="size-4" />
        Новый чат
      </button>
      <ImageIcon className="hidden" />
      <Trash2 className="hidden" />
    </div>
  )
}
