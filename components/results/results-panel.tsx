"use client"

import Image from "next/image"

import type { ModelSummary } from "@/lib/catalog/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { ResultsPagination } from "@/components/results/results-pagination"
import { CheckIcon, XIcon } from "lucide-react"

const formatNumber = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString()

const formatPrice = (value: number | null) => {
  if (value === null) return "N/A"
  return `$${value.toFixed(2)}/M`
}

type ResultsPanelProps = {
  items: ModelSummary[]
  total: number
  page: number
  pageSize: number
  selectedId: string | null
  isLoading: boolean
  error?: Error | null
  usedStrict?: boolean
  query: string
  onSelect: (id: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function ResultsPanel({
  items,
  total,
  page,
  pageSize,
  selectedId,
  isLoading,
  error,
  usedStrict,
  query,
  onSelect,
  onPageChange,
  onPageSizeChange,
}: ResultsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Results</div>
        <div className="text-muted-foreground text-xs">
          {isLoading ? "Loading..." : `${total.toLocaleString()} models`}
        </div>
      </div>

      {usedStrict === false && query && !isLoading && (
        <div className="text-muted-foreground text-xs">
          No exact matches. Showing loose results.
        </div>
      )}

      <div className="hidden lg:block">
        <div className="border-border overflow-x-auto border">
          <div className="bg-muted text-muted-foreground grid min-w-[900px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_90px_70px_90px_120px] gap-2 px-4 py-2 text-[11px]">
            <div>Model</div>
            <div>Provider</div>
            <div>Modalities</div>
            <div>Context</div>
            <div>Tool call</div>
            <div>Open weights</div>
            <div>Price</div>
          </div>
          <div className="divide-y">
            {isLoading && items.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid min-w-[900px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_90px_70px_90px_120px] gap-2 px-4 py-3"
                  >
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))
              : items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`grid min-w-[900px] w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_90px_70px_90px_120px] gap-2 px-4 py-3 text-left text-xs transition-colors ${
                      selectedId === item.id
                        ? "bg-muted"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {item.name ?? item.id}
                      </div>
                      <div className="text-muted-foreground truncate text-[11px]">
                        {item.id}
                      </div>
                      {item.status === "deprecated" && (
                        <Badge variant="destructive" className="mt-1">
                          Deprecated
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.logoUrl && (
                        <Image
                          src={item.logoUrl}
                          alt={item.providerName ?? item.providerId}
                          width={20}
                          height={20}
                          className="size-5"
                        />
                      )}
                      <span className="min-w-0 truncate">
                        {item.providerName ?? item.providerId}
                      </span>
                    </div>
                    <div className="min-w-0 flex flex-wrap gap-1">
                      {item.modalitiesIn.map((modality) => (
                        <Badge key={`in-${modality}`} variant="outline">
                          in:{modality}
                        </Badge>
                      ))}
                      {item.modalitiesOut.map((modality) => (
                        <Badge key={`out-${modality}`} variant="secondary">
                          out:{modality}
                        </Badge>
                      ))}
                    </div>
                    <div>{formatNumber(item.contextTokens)}</div>
                    <div className="flex items-center gap-1">
                      {item.toolCall ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <XIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.openWeights ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <XIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-[11px]">
                      <div>{formatPrice(item.priceInPerMTokens)}</div>
                      <div className="text-muted-foreground">
                        {formatPrice(item.priceOutPerMTokens)}
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {isLoading && items.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-border border p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-32" />
                <Skeleton className="mt-4 h-3 w-24" />
              </div>
            ))
          : items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`border-border flex flex-col gap-2 border p-4 text-left ${
                  selectedId === item.id ? "bg-muted" : "hover:bg-muted/60"
                }`}
                onClick={() => onSelect(item.id)}
              >
                <div>
                  <div className="font-medium">{item.name ?? item.id}</div>
                  <div className="text-muted-foreground text-[11px]">
                    {item.id}
                  </div>
                </div>
                <div className="text-xs">
                  {item.providerName ?? item.providerId}
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.modalitiesIn.map((modality) => (
                    <Badge
                      key={`mobile-${item.id}-in-${modality}`}
                      variant="outline"
                    >
                      in:{modality}
                    </Badge>
                  ))}
                  {item.modalitiesOut.map((modality) => (
                    <Badge
                      key={`mobile-${item.id}-out-${modality}`}
                      variant="secondary"
                    >
                      out:{modality}
                    </Badge>
                  ))}
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Context: {formatNumber(item.contextTokens)}
                </div>
              </button>
            ))}
      </div>

      {error && (
        <EmptyState
          title="Unable to load results"
          description="Check your connection or try again in a moment."
        />
      )}

      {!isLoading && items.length === 0 && !error && (
        <EmptyState
          title="No models match your filters"
          description="Try loosening one of the filters or clear presets to see more options."
        />
      )}

      <Separator />

      <ResultsPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
