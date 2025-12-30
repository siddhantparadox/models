"use client"

import * as React from "react"

import type { ModelDetail, ModelSummary } from "@/lib/catalog/types"
import { CopyButton } from "@/components/common/copy-button"
import { Button } from "@/components/ui/button"

const formatNumber = (value: number | null) =>
  value === null ? null : value

const formatPrice = (value: number | null) =>
  value === null ? null : value

const buildMarkdown = (summary: ModelSummary, detail: ModelDetail | null) => {
  const lines = [
    `# ${summary.name ?? summary.id}`,
    "",
    `- id: ${summary.id}`,
    `- provider: ${summary.providerName ?? summary.providerId}`,
  ]

  if (summary.modalitiesIn.length) {
    lines.push(`- modalities in: ${summary.modalitiesIn.join(", ")}`)
  }
  if (summary.modalitiesOut.length) {
    lines.push(`- modalities out: ${summary.modalitiesOut.join(", ")}`)
  }
  if (summary.contextTokens !== null) {
    lines.push(`- context tokens: ${summary.contextTokens}`)
  }
  if (summary.outputTokens !== null) {
    lines.push(`- output tokens: ${summary.outputTokens}`)
  }
  if (summary.priceInPerMTokens !== null) {
    lines.push(`- price in: $${summary.priceInPerMTokens}/M tokens`)
  }
  if (summary.priceOutPerMTokens !== null) {
    lines.push(`- price out: $${summary.priceOutPerMTokens}/M tokens`)
  }
  if (summary.releaseDate) {
    lines.push(`- release date: ${summary.releaseDate}`)
  }
  if (summary.lastUpdated) {
    lines.push(`- last updated: ${summary.lastUpdated}`)
  }
  if (summary.knowledgeCutoff) {
    lines.push(`- knowledge cutoff: ${summary.knowledgeCutoff}`)
  }

  if (detail?.normalized.source.docUrl) {
    lines.push(`- docs: ${detail.normalized.source.docUrl}`)
  }

  return lines.join("\n")
}

const buildJson = (summary: ModelSummary, detail: ModelDetail | null) => {
  const normalized = detail?.normalized

  const payload = {
    id: summary.id,
    name: summary.name,
    provider: {
      id: summary.providerId,
      name: summary.providerName,
    },
    modalities: {
      input: summary.modalitiesIn,
      output: summary.modalitiesOut,
    },
    limits: {
      context: formatNumber(summary.contextTokens),
      output: formatNumber(summary.outputTokens),
    },
    pricing: {
      input: formatPrice(summary.priceInPerMTokens),
      output: formatPrice(summary.priceOutPerMTokens),
    },
    dates: {
      release: summary.releaseDate,
      lastUpdated: summary.lastUpdated,
      knowledgeCutoff: summary.knowledgeCutoff,
    },
    source: normalized?.source ?? null,
  }

  return JSON.stringify(payload, null, 2)
}

type ExportSectionProps = {
  summary: ModelSummary
  detail: ModelDetail | null
}

export function ExportSection({ summary, detail }: ExportSectionProps) {
  const markdown = React.useMemo(() => buildMarkdown(summary, detail), [
    summary,
    detail,
  ])
  const json = React.useMemo(() => buildJson(summary, detail), [summary, detail])
  const specPath = React.useMemo(() => {
    const encoded = summary.id
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    return `/model/${encoded}`
  }, [summary.id])

  return (
    <div className="flex flex-col gap-3">
      <CopyButton value={summary.id} label="Copy model id" />
      <CopyButton value={markdown} label="Copy Markdown" />
      <CopyButton value={json} label="Copy JSON" />
      <Button asChild variant="outline" size="sm">
        <a href={specPath}>Open spec page</a>
      </Button>
    </div>
  )
}
