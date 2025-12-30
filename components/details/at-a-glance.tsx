import Image from "next/image"

import type { ModelSummary } from "@/lib/catalog/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const formatNumber = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString()

const formatPrice = (value: number | null) => {
  if (value === null) return "N/A"
  return `$${value.toFixed(2)}/M`
}

type AtAGlanceProps = {
  summary: ModelSummary
}

export function AtAGlance({ summary }: AtAGlanceProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-medium">{summary.name ?? summary.id}</div>
        <div className="text-muted-foreground text-xs">{summary.id}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {summary.logoUrl && (
          <Image
            src={summary.logoUrl}
            alt={summary.providerName ?? summary.providerId}
            width={20}
            height={20}
            className="size-5"
          />
        )}
        <span>{summary.providerName ?? summary.providerId}</span>
        {summary.status === "deprecated" && (
          <Badge variant="destructive">Deprecated</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.toolCall && <Badge variant="secondary">Tool calling</Badge>}
        {summary.structuredOutput && (
          <Badge variant="secondary">Structured output</Badge>
        )}
        {summary.openWeights && <Badge variant="secondary">Open weights</Badge>}
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.modalitiesIn.map((modality) => (
          <Badge key={`in-${modality}`} variant="outline">
            in:{modality}
          </Badge>
        ))}
        {summary.modalitiesOut.map((modality) => (
          <Badge key={`out-${modality}`} variant="outline">
            out:{modality}
          </Badge>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Context</div>
          <div>{formatNumber(summary.contextTokens)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Output</div>
          <div>{formatNumber(summary.outputTokens)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Input price</div>
          <div>{formatPrice(summary.priceInPerMTokens)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Output price</div>
          <div>{formatPrice(summary.priceOutPerMTokens)}</div>
        </div>
      </div>
    </div>
  )
}
