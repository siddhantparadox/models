"use client"

import * as React from "react"

import type { ModelDetail, ModelSummary } from "@/lib/catalog/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { AtAGlance } from "@/components/details/at-a-glance"
import { CostSection } from "@/components/details/cost-section"
import { AlternativesSection } from "@/components/details/alternatives-section"
import { ExportSection } from "@/components/details/export-section"

const DEFAULT_OPEN = "overview"

type DetailsPanelProps = {
  summary: ModelSummary | null
  detail: ModelDetail | null
  isLoading: boolean
  error?: Error | null
  onClearSelection?: () => void
}

export function DetailsPanel({
  summary,
  detail,
  isLoading,
  error,
  onClearSelection,
}: DetailsPanelProps) {
  const [openItem, setOpenItem] = React.useState<string>(DEFAULT_OPEN)

  if (!summary && !isLoading) {
    if (error) {
      return (
        <EmptyState
          title="Unable to load details"
          description="Check your connection or try again in a moment."
        />
      )
    }
    return (
      <EmptyState
        title="Select a model"
        description="Click a row to see details, cost estimates, and export options."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Model details</div>
        {summary && onClearSelection && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="text-muted-foreground text-xs">
          Unable to load full details. Showing cached summary when available.
        </div>
      )}

      {isLoading && !detail && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {summary && (
        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={(nextValue) => setOpenItem(nextValue)}
          className="w-full"
        >
          <AccordionItem value="overview">
            <AccordionTrigger>At a glance</AccordionTrigger>
            <AccordionContent>
              <AtAGlance summary={summary} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cost">
            <AccordionTrigger>Cost estimate</AccordionTrigger>
            <AccordionContent>
              <CostSection summary={summary} detail={detail} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="alternatives">
            <AccordionTrigger>Open weights alternatives</AccordionTrigger>
            <AccordionContent>
              <AlternativesSection
                summary={summary}
                open={openItem === "alternatives"}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="export">
            <AccordionTrigger data-export-trigger="true">
              Export and share
            </AccordionTrigger>
            <AccordionContent>
              <ExportSection summary={summary} detail={detail} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
