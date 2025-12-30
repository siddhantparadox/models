"use client"

import * as React from "react"

import type { ModelDetail, ModelSummary } from "@/lib/catalog/types"
import { estimateCost } from "@/lib/cost/calc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const toNumber = (value: string) => {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/A"
  return `$${value.toFixed(4)}`
}

type CostSectionProps = {
  summary: ModelSummary
  detail: ModelDetail | null
}

export function CostSection({ summary, detail }: CostSectionProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [inputs, setInputs] = React.useState({
    inputTokens: 1000,
    outputTokens: 1000,
    callsPerDay: 100,
    callsPerMonth: 3000,
    reasoningTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    inputAudioTokens: 0,
    outputAudioTokens: 0,
  })

  const rates = {
    input: detail?.normalized.cost.input ?? summary.priceInPerMTokens,
    output: detail?.normalized.cost.output ?? summary.priceOutPerMTokens,
    reasoning: detail?.normalized.cost.reasoning ?? null,
    cacheRead: detail?.normalized.cost.cacheRead ?? null,
    cacheWrite: detail?.normalized.cost.cacheWrite ?? null,
    inputAudio: detail?.normalized.cost.inputAudio ?? null,
    outputAudio: detail?.normalized.cost.outputAudio ?? null,
  }

  const estimate = estimateCost(rates, inputs)
  const hasAnyRate = Object.values(rates).some((value) => value !== null)

  return (
    <div className="flex flex-col gap-4">
      {!hasAnyRate && (
        <div className="text-muted-foreground text-xs">
          Pricing is not available for this model yet.
        </div>
      )}

      <div className="grid gap-3 text-xs">
        <div className="grid gap-1">
          <label htmlFor="input-tokens">Input tokens per call</label>
          <Input
            id="input-tokens"
            type="number"
            inputMode="numeric"
            value={inputs.inputTokens}
            onChange={(event) =>
              setInputs((prev) => ({
                ...prev,
                inputTokens: toNumber(event.target.value),
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="output-tokens">Output tokens per call</label>
          <Input
            id="output-tokens"
            type="number"
            inputMode="numeric"
            value={inputs.outputTokens}
            onChange={(event) =>
              setInputs((prev) => ({
                ...prev,
                outputTokens: toNumber(event.target.value),
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="calls-per-day">Calls per day</label>
          <Input
            id="calls-per-day"
            type="number"
            inputMode="numeric"
            value={inputs.callsPerDay}
            onChange={(event) =>
              setInputs((prev) => ({
                ...prev,
                callsPerDay: toNumber(event.target.value),
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="calls-per-month">Calls per month</label>
          <Input
            id="calls-per-month"
            type="number"
            inputMode="numeric"
            value={inputs.callsPerMonth}
            onChange={(event) =>
              setInputs((prev) => ({
                ...prev,
                callsPerMonth: toNumber(event.target.value),
              }))
            }
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced((prev) => !prev)}
      >
        {showAdvanced ? "Hide" : "Show"} advanced inputs
      </Button>

      {showAdvanced && (
        <div className="grid gap-3 text-xs">
          <div className="grid gap-1">
            <label htmlFor="reasoning-tokens">Reasoning tokens</label>
            <Input
              id="reasoning-tokens"
              type="number"
              inputMode="numeric"
              value={inputs.reasoningTokens}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  reasoningTokens: toNumber(event.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="cache-read">Cache read tokens</label>
            <Input
              id="cache-read"
              type="number"
              inputMode="numeric"
              value={inputs.cacheReadTokens}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  cacheReadTokens: toNumber(event.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="cache-write">Cache write tokens</label>
            <Input
              id="cache-write"
              type="number"
              inputMode="numeric"
              value={inputs.cacheWriteTokens}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  cacheWriteTokens: toNumber(event.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="input-audio">Input audio tokens</label>
            <Input
              id="input-audio"
              type="number"
              inputMode="numeric"
              value={inputs.inputAudioTokens}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  inputAudioTokens: toNumber(event.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="output-audio">Output audio tokens</label>
            <Input
              id="output-audio"
              type="number"
              inputMode="numeric"
              value={inputs.outputAudioTokens}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  outputAudioTokens: toNumber(event.target.value),
                }))
              }
            />
          </div>
        </div>
      )}

      {estimate.missingRates.length > 0 && (
        <div className="text-muted-foreground text-xs">
          Missing pricing for: {estimate.missingRates.join(", ")}
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Per call</div>
          <div className="font-medium">{formatCurrency(estimate.perCall)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Per day</div>
          <div className="font-medium">{formatCurrency(estimate.perDay)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Per month</div>
          <div className="font-medium">{formatCurrency(estimate.perMonth)}</div>
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        Estimates assume tokens scale linearly with your prompt and output.
      </div>

      <div className="flex flex-col gap-2">
        {estimate.breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs">{item.label}</span>
            <Badge variant="outline">{formatCurrency(item.costPerCall)}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
