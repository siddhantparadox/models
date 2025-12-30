import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-border text-muted-foreground rounded-none p-6 text-xs",
        className
      )}
    >
      <div className="text-foreground font-medium">{title}</div>
      {description && <p className="mt-2 text-xs/relaxed">{description}</p>}
    </div>
  )
}
