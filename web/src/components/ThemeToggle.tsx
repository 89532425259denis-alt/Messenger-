import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme"

const options: { value: Theme; icon: typeof Moon; label: string }[] = [
  { value: "light", icon: Sun, label: "Светлая" },
  { value: "dark", icon: Moon, label: "Тёмная" },
  { value: "system", icon: Monitor, label: "Системная" },
]

export function ThemeToggle({ className }: { className?: string }) {
  const [current, setCurrent] = useState<Theme>("system")

  useEffect(() => {
    setCurrent(getStoredTheme())
  }, [])

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-surface-2 p-1",
        className
      )}
      role="radiogroup"
      aria-label="Тема оформления"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => {
              setTheme(value)
              setCurrent(value)
            }}
            className={cn(
              "grid size-9 place-items-center rounded-full transition-colors",
              active
                ? "bg-accent text-accent-fg"
                : "text-muted-fg hover:text-fg"
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
