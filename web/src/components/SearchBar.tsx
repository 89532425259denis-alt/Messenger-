import { Search, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchBarProps = {
  value: string
  onChange: (v: string) => void
  onMenu?: () => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onMenu,
  placeholder = "поиск...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        className={cn(
          "flex flex-1 items-center gap-3 rounded-full px-4 py-3",
          "border border-border bg-surface-2 text-fg",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
          "transition-colors"
        )}
      >
        <Search className="size-5 shrink-0 text-muted-fg" aria-hidden />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-muted-fg",
            "text-base"
          )}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button
        type="button"
        onClick={onMenu}
        aria-label="Меню"
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          "border border-border bg-surface-2 text-fg",
          "hover:bg-surface transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <MoreVertical className="size-5" aria-hidden />
      </button>
    </div>
  )
}
