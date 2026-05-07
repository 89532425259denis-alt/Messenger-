import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-5 pt-6 pb-6">
      <div className={cn("flex h-full flex-col gap-5", className)}>{children}</div>
    </div>
  )
}
