"use client"

import * as React from "react"
import useSWR from "swr"

import type { AlternativesResponse } from "@/lib/api/types"
import { apiFetcher } from "@/lib/api/fetcher"
import type { ModelSummary } from "@/lib/catalog/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { TooltipInfo } from "@/components/common/tooltip-info"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const formatNumber = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString()

const formatBool = (value: boolean | null) =>
  value === null ? "N/A" : value ? "Yes" : "No"

type AlternativesSectionProps = {
  summary: ModelSummary
  open: boolean
}

export function AlternativesSection({ summary, open }: AlternativesSectionProps) {
  const [hasRequested, setHasRequested] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = React.useState<number | null>(null)
  const scoreDescription = (
    <div className="space-y-1">
      <div>
        Nearest-match score across open weights models (top 10 results).
      </div>
      <div>
        Weights: modalities 20, context 25, output 15, capability 20, price 10,
        recency 10.
      </div>
      <div>
        Only open weights models are considered.
      </div>
      <div>
        Modalities are scored for input and output match against the base.
      </div>
      <div>
        Capability compares tool calling, structured output, reasoning, and
        temperature control.
      </div>
      <div>
        Context/output use closeness to the base model. Price compares total
        input + output cost.
      </div>
      <div>
        Recency uses last updated, release date, or knowledge cutoff.
      </div>
      <div>
        Missing fields are neutral, except missing price when base pricing
        exists.
      </div>
      <div>
        Deprecated models are penalized by 20 points.
      </div>
    </div>
  )
  const actionTooltip = {
    title: hasRequested ? "Refresh alternatives" : "Find open weights alternatives",
    description: (
      <div className="space-y-1">
        <div>
          Finds the nearest open weights models using similarity scoring.
        </div>
        <div>
          Modalities, capacity, capabilities, price, and recency all factor in.
        </div>
      </div>
    ),
  }

  React.useEffect(() => {
    setHasRequested(false)
  }, [summary.id])

  const url = React.useMemo(() => {
    if (!open || !hasRequested) return null
    const params = new URLSearchParams()
    params.set("id", summary.id)
    params.set("limit", "10")

    return `/api/alternatives?${params.toString()}`
  }, [open, hasRequested, summary.id])

  const { data, error, isLoading, mutate } = useSWR<AlternativesResponse>(
    url,
    apiFetcher
  )

  const updateMaxHeight = React.useCallback(() => {
    if (!listRef.current) return
    const exportTrigger = document.querySelector(
      "[data-export-trigger=\"true\"]"
    )
    if (!(exportTrigger instanceof HTMLElement)) return

    const listRect = listRef.current.getBoundingClientRect()
    const exportRect = exportTrigger.getBoundingClientRect()
    const available = Math.max(160, exportRect.top - listRect.top - 8)
    setMaxHeight(available)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    updateMaxHeight()

    const handleResize = () => updateMaxHeight()
    window.addEventListener("resize", handleResize)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleResize)
      if (listRef.current) observer.observe(listRef.current)
      const exportTrigger = document.querySelector(
        "[data-export-trigger=\"true\"]"
      )
      if (exportTrigger instanceof HTMLElement) observer.observe(exportTrigger)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      observer?.disconnect()
    }
  }, [open, updateMaxHeight, data?.items?.length])

  if (!open) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>Click to calculate open weights alternatives.</span>
          <TooltipInfo
            label="Score calculation"
            description={scoreDescription}
            variant="hover"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => {
                if (!hasRequested) {
                  setHasRequested(true)
                  return
                }
                void mutate()
              }}
            >
              {hasRequested ? "Refresh alternatives" : "Find open weights alternatives"}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs/relaxed max-w-[240px]">
            <div className="font-medium">{actionTooltip.title}</div>
            <div className="text-muted-foreground mt-1">
              {actionTooltip.description}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {!hasRequested && (
        <EmptyState
          title="Calculate alternatives"
          description={"Click \"Find open weights alternatives\" to compute the nearest matches."}
        />
      )}

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && (
        <EmptyState
          title="Unable to load alternatives"
          description="Try again in a moment."
        />
      )}

      {hasRequested && !isLoading && !error && data?.items?.length === 0 && (
        <EmptyState
          title="No alternatives found"
          description="Try refreshing to re-run the search."
        />
      )}

      <div
        ref={listRef}
        data-alternatives-list="true"
        className="flex flex-col gap-2 overflow-y-auto pr-1"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {data?.items?.map((item) => (
          <div key={item.id} className="border-border border p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-medium">{item.summary.name ?? item.id}</div>
              <Badge variant="secondary">Score {item.score}</Badge>
            </div>
            <div className="text-muted-foreground mt-1">{item.id}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {item.reasons.map((reason) => (
                <Badge key={reason} variant="outline">
                  {reason}
                </Badge>
              ))}
            </div>
            <div className="text-muted-foreground mt-2 text-[11px]">
              Context: {formatNumber(item.summary.contextTokens)} | Output:{" "}
              {formatNumber(item.summary.outputTokens)} | Tool call:{" "}
              {formatBool(item.summary.toolCall)} | Structured:{" "}
              {formatBool(item.summary.structuredOutput)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
