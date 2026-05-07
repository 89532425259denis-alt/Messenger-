import { cn } from "@/lib/utils"
import { Avatar } from "./Avatar"
import type { Chat } from "@/lib/api"

type ChatCardProps = {
  chat: Chat
  onClick?: () => void
}

function formatTime(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" })
}

export function ChatCard({ chat, onClick }: ChatCardProps) {
  const time = formatTime(chat.last_message_at)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-3xl px-4 py-3.5",
        "bg-surface text-left transition-colors",
        "hover:bg-surface-2 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <Avatar src={chat.avatar_url} name={chat.title} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-base font-semibold text-fg">
            {chat.title || "Без названия"}
          </h3>
          {chat.unread_count > 0 && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
              {chat.unread_count > 99 ? "99+" : chat.unread_count}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="line-clamp-1 text-sm text-muted-fg">
            {chat.last_message_preview ?? <span className="italic">пока нет сообщений</span>}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-muted-fg">{time}</span>
        </div>
      </div>
    </button>
  )
}
