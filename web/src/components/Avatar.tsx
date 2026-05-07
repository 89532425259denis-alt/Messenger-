import { cn } from "@/lib/utils"

type AvatarProps = {
  src?: string | null
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "size-9 text-sm",
  md: "size-14 text-lg",
  lg: "size-20 text-2xl",
}

function initials(name?: string) {
  if (!name) return ""
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "")
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-full shrink-0",
        "bg-avatar-bg text-avatar-fg font-semibold",
        sizeMap[size],
        className
      )}
      aria-label={name ?? "avatar"}
    >
      {src ? (
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </div>
  )
}
