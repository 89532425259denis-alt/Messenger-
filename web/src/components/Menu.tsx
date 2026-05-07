import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type MenuItem = {
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
}

type MenuProps = {
  items: MenuItem[]
  onClose: () => void
  className?: string
}

export function Menu({ items, onClose, className }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        "absolute right-0 top-full z-30 mt-2 min-w-56 origin-top-right",
        "glass-strong rounded-2xl p-1 shadow-glass dark:shadow-glass-dark",
        "animate-slide-up",
        className
      )}
    >
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              item.onSelect?.()
              onClose()
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
              "transition-colors hover:bg-surface-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              item.destructive && "text-danger hover:bg-danger/10",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {Icon ? <Icon className="size-4" aria-hidden /> : <span className="size-4" />}
            <span className="flex-1">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
