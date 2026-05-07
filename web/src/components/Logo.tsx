import { cn } from "@/lib/utils"

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
}

const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-7xl",
}

export function Logo({ size = "md", className, text = "DEVO+" }: LogoProps) {
  return (
    <span
      className={cn(
        "logo-text inline-block leading-none text-fg select-none",
        sizeMap[size],
        className
      )}
      aria-label={text}
    >
      {text}
    </span>
  )
}
