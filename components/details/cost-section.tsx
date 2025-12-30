"use client"

import * as React from "react"

import type { ModelDetail, ModelSummary } from "@/lib/catalog/types"
import { estimateCost } from "@/lib/cost/calc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TooltipInfo } from "@/components/common/tooltip-info"

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

  const outputRate = detail?.normalized.cost.output ?? summary.priceOutPerMTokens
  const reasoningSupported =
    detail?.normalized.cost.reasoning != null ||
    (detail?.normalized.reasoning ?? summary.reasoning) === true
  const inputAudioSupported =
    summary.modalitiesIn.includes("audio") ||
    detail?.normalized.cost.inputAudio != null
  const outputAudioSupported =
    summary.modalitiesOut.includes("audio") ||
    detail?.normalized.cost.outputAudio != null
  const cacheReadSupported = detail?.normalized.cost.cacheRead != null
  const cacheWriteSupported = detail?.normalized.cost.cacheWrite != null

  const rates = {
    input: detail?.normalized.cost.input ?? summary.priceInPerMTokens,
    output: outputRate,
    reasoning: detail?.normalized.cost.reasoning ?? (reasoningSupported ? outputRate : null),
    cacheRead: detail?.normalized.cost.cacheRead ?? null,
    cacheWrite: detail?.normalized.cost.cacheWrite ?? null,
    inputAudio: detail?.normalized.cost.inputAudio ?? null,
    outputAudio: detail?.normalized.cost.outputAudio ?? null,
  }

  const effectiveInputs = {
    ...inputs,
    reasoningTokens: reasoningSupported ? inputs.reasoningTokens : 0,
    cacheReadTokens: cacheReadSupported ? inputs.cacheReadTokens : 0,
    cacheWriteTokens: cacheWriteSupported ? inputs.cacheWriteTokens : 0,
    inputAudioTokens: inputAudioSupported ? inputs.inputAudioTokens : 0,
    outputAudioTokens: outputAudioSupported ? inputs.outputAudioTokens : 0,
  }

  const estimate = estimateCost(rates, effectiveInputs)
  const hasAnyRate = Object.values(rates).some((value) => value !== null)
  const inputsClassName = showAdvanced
    ? "flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1 text-xs"
    : "flex flex-col gap-3 text-xs"

  return (
    <div className="flex flex-col gap-4">
      {!hasAnyRate && (
        <div className="text-muted-foreground text-xs">
          Pricing is not available for this model yet.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Cost inputs</div>
        <TooltipInfo
          label="Cost input definitions"
          variant="hover"
          description={
            <ul className="list-disc space-y-1 pl-4">
              <li>Input tokens: tokens sent to the model per call.</li>
              <li>
                Output tokens: response tokens, excluding reasoning tokens.
              </li>
              <li>
                Reasoning tokens: reasoning-only tokens; billed at output rate
                unless a dedicated reasoning price exists.
              </li>
              <li>Calls per day/month: projections only.</li>
              <li>Cache read/write: cached tokens in/out.</li>
              <li>Audio in/out: audio tokens sent or generated.</li>
              <li>Disabled fields mean the model does not support it.</li>
              <li>All rates are USD per 1M tokens from models.dev.</li>
            </ul>
          }
        />
      </div>

      <div className={inputsClassName}>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced ? "Hide" : "Show"} advanced inputs
        </Button>

        {showAdvanced && (
          <>
            <div className={`grid gap-1${reasoningSupported ? "" : " opacity-60"}`}>
              <label htmlFor="reasoning-tokens">Reasoning tokens</label>
              <Input
                id="reasoning-tokens"
                type="number"
                inputMode="numeric"
                value={reasoningSupported ? inputs.reasoningTokens : 0}
                disabled={!reasoningSupported}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    reasoningTokens: toNumber(event.target.value),
                  }))
                }
              />
              {!reasoningSupported && (
                <div className="text-muted-foreground text-[11px]">
                  Model does not support this.
                </div>
              )}
            </div>
            <div className={`grid gap-1${cacheReadSupported ? "" : " opacity-60"}`}>
              <label htmlFor="cache-read">Cache read tokens</label>
              <Input
                id="cache-read"
                type="number"
                inputMode="numeric"
                value={cacheReadSupported ? inputs.cacheReadTokens : 0}
                disabled={!cacheReadSupported}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    cacheReadTokens: toNumber(event.target.value),
                  }))
                }
              />
              {!cacheReadSupported && (
                <div className="text-muted-foreground text-[11px]">
                  Model does not support this.
                </div>
              )}
            </div>
            <div className={`grid gap-1${cacheWriteSupported ? "" : " opacity-60"}`}>
              <label htmlFor="cache-write">Cache write tokens</label>
              <Input
                id="cache-write"
                type="number"
                inputMode="numeric"
                value={cacheWriteSupported ? inputs.cacheWriteTokens : 0}
                disabled={!cacheWriteSupported}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    cacheWriteTokens: toNumber(event.target.value),
                  }))
                }
              />
              {!cacheWriteSupported && (
                <div className="text-muted-foreground text-[11px]">
                  Model does not support this.
                </div>
              )}
            </div>
            <div className={`grid gap-1${inputAudioSupported ? "" : " opacity-60"}`}>
              <label htmlFor="input-audio">Input audio tokens</label>
              <Input
                id="input-audio"
                type="number"
                inputMode="numeric"
                value={inputAudioSupported ? inputs.inputAudioTokens : 0}
                disabled={!inputAudioSupported}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    inputAudioTokens: toNumber(event.target.value),
                  }))
                }
              />
              {!inputAudioSupported && (
                <div className="text-muted-foreground text-[11px]">
                  Model does not support this.
                </div>
              )}
            </div>
            <div className={`grid gap-1${outputAudioSupported ? "" : " opacity-60"}`}>
              <label htmlFor="output-audio">Output audio tokens</label>
              <Input
                id="output-audio"
                type="number"
                inputMode="numeric"
                value={outputAudioSupported ? inputs.outputAudioTokens : 0}
                disabled={!outputAudioSupported}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    outputAudioTokens: toNumber(event.target.value),
                  }))
                }
              />
              {!outputAudioSupported && (
                <div className="text-muted-foreground text-[11px]">
                  Model does not support this.
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
