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

const formatNumber = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString()

const formatBool = (value: boolean | null) =>
  value === null ? "N/A" : value ? "Yes" : "No"

type AlternativesSectionProps = {
  summary: ModelSummary
  open: boolean
}

export function AlternativesSection({ summary, open }: AlternativesSectionProps) {
  const [relaxed, setRelaxed] = React.useState(false)

  const url = React.useMemo(() => {
    if (!open) return null
    const params = new URLSearchParams()
    params.set("id", summary.id)
    params.set("limit", "6")

    if (relaxed) {
      if (summary.contextTokens) {
        params.set(
          "minContext",
          String(Math.floor(summary.contextTokens * 0.5))
        )
      }
      if (summary.outputTokens) {
        params.set(
          "minOutput",
          String(Math.floor(summary.outputTokens * 0.5))
        )
      }
      params.set("requireToolCall", "false")
      params.set("requireStructuredOutput", "false")
    }

    return `/api/alternatives?${params.toString()}`
  }, [open, relaxed, summary])

  const { data, error, isLoading } = useSWR<AlternativesResponse>(
    url,
    apiFetcher
  )

  if (!open) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          Open weights alternatives load on demand.
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRelaxed((prev) => !prev)}
        >
          {relaxed ? "Reset" : "Relax constraints"}
        </Button>
      </div>

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

      {!isLoading && !error && data?.items?.length === 0 && (
        <EmptyState
          title="No alternatives found"
          description="Try relaxing constraints to widen the search."
        />
      )}

      <div className="flex flex-col gap-2">
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
