import { notFound } from "next/navigation"

import { getCatalog } from "@/lib/catalog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const formatNumber = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString()

const formatPrice = (value: number | null) =>
  value === null ? "N/A" : `$${value}/M`

const formatBoolean = (value: boolean | null) =>
  value === null ? "N/A" : value ? "Yes" : "No"

type ModelPageProps = {
  params: Promise<{ id?: string[] | string }>
}

export default async function ModelPage({ params }: ModelPageProps) {
  const resolvedParams = await params
  const rawSegments = Array.isArray(resolvedParams.id)
    ? resolvedParams.id
    : resolvedParams.id
    ? [resolvedParams.id]
    : []
  const segments = rawSegments.filter((segment) => segment !== "")

  if (!segments.length) {
    notFound()
  }

  const id = segments
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join("/")
    .replace(/^\/+|\/+$/g, "")
  const catalog = await getCatalog()
  const summary = catalog.summaryById.get(id)
  const detail = catalog.byId.get(id)

  if (!summary || !detail) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <div className="text-sm font-medium">{summary.name ?? summary.id}</div>
        <div className="text-muted-foreground text-xs">{summary.id}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.toolCall && <Badge variant="secondary">Tool calling</Badge>}
          {summary.structuredOutput && (
            <Badge variant="secondary">Structured output</Badge>
          )}
          {summary.openWeights && <Badge variant="secondary">Open weights</Badge>}
          {summary.status === "deprecated" && (
            <Badge variant="destructive">Deprecated</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>Provider: {summary.providerName ?? summary.providerId}</div>
            <div>Modalities in: {summary.modalitiesIn.join(", ") || "N/A"}</div>
            <div>Modalities out: {summary.modalitiesOut.join(", ") || "N/A"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>Tool calling: {formatBoolean(summary.toolCall)}</div>
            <div>
              Structured output: {formatBoolean(summary.structuredOutput)}
            </div>
            <div>Open weights: {formatBoolean(summary.openWeights)}</div>
            <div>Reasoning: {formatBoolean(detail.normalized.reasoning)}</div>
            <div>Attachments: {formatBoolean(detail.normalized.attachment)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Context tokens</div>
            <div>{formatNumber(summary.contextTokens)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Output tokens</div>
            <div>{formatNumber(summary.outputTokens)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Input</div>
            <div>{formatPrice(detail.normalized.cost.input)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Output</div>
            <div>{formatPrice(detail.normalized.cost.output)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Reasoning</div>
            <div>{formatPrice(detail.normalized.cost.reasoning)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Cache read/write</div>
            <div>
              {formatPrice(detail.normalized.cost.cacheRead)} /{" "}
              {formatPrice(detail.normalized.cost.cacheWrite)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-xs sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Release</div>
            <div>{summary.releaseDate ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last updated</div>
            <div>{summary.lastUpdated ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Knowledge cutoff</div>
            <div>{summary.knowledgeCutoff ?? "N/A"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            Docs:{" "}
            {detail.normalized.source.docUrl ? (
              <a
                href={detail.normalized.source.docUrl}
                className="underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                {detail.normalized.source.docUrl}
              </a>
            ) : (
              "N/A"
            )}
          </div>
          <div>
            API:{" "}
            {detail.normalized.source.apiUrl ? (
              <a
                href={detail.normalized.source.apiUrl}
                className="underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                {detail.normalized.source.apiUrl}
              </a>
            ) : (
              "N/A"
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-muted-foreground text-xs">
        This spec sheet is auto-generated from the Models.dev catalog.
      </div>
    </main>
  )
}
