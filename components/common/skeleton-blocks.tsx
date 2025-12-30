import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type SkeletonBlocksProps = {
  lines?: number
  className?: string
}

export function SkeletonBlocks({ lines = 3, className }: SkeletonBlocksProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-3 w-full" />
      ))}
    </div>
  )
}
