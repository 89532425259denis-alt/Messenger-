export function ChatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-3xl bg-surface px-4 py-3.5"
        >
          <div className="size-14 shrink-0 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-4 w-2/3 rounded-full bg-muted" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
