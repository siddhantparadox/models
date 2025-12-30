"use client"

import * as React from "react"

import type { ProviderInfo } from "@/lib/catalog/types"
import type { UrlState } from "@/lib/url/state"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { TooltipInfo } from "@/components/common/tooltip-info"

const LONG_CONTEXT = 128000

type FiltersPanelProps = {
  state: UrlState
  providers: ProviderInfo[]
  modalitiesIn: string[]
  modalitiesOut: string[]
  onUpdate: (patch: Partial<UrlState>, options?: { resetPage?: boolean }) => void
}

const toggleListValue = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]

const parseNumberInput = (value: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function FiltersPanel({
  state,
  providers,
  modalitiesIn,
  modalitiesOut,
  onUpdate,
}: FiltersPanelProps) {
  const update = (patch: Partial<UrlState>) =>
    onUpdate(patch, { resetPage: true })

  const presets = [
    {
      label: "Tool calling",
      active: state.toolCall,
      onClick: () => update({ toolCall: !state.toolCall }),
    },
    {
      label: "Open weights",
      active: state.openWeights,
      onClick: () => update({ openWeights: !state.openWeights }),
    },
    {
      label: "Vision input",
      active: state.modalitiesIn.includes("image"),
      onClick: () =>
        update({
          modalitiesIn: toggleListValue(state.modalitiesIn, "image"),
        }),
    },
    {
      label: "Long context",
      active: (state.minContext ?? 0) >= LONG_CONTEXT,
      onClick: () =>
        update({
          minContext:
            (state.minContext ?? 0) >= LONG_CONTEXT ? null : LONG_CONTEXT,
        }),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">Presets</div>
          <TooltipInfo
            label="Presets"
            description="One-click filters for common requirements."
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={preset.active ? "secondary" : "outline"}
              onClick={preset.onClick}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <Accordion
        type="multiple"
        defaultValue={["capabilities", "limits"]}
        className="w-full"
      >
        <AccordionItem value="capabilities">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Capabilities</span>
              <TooltipInfo
                label="Capabilities"
                description="Filter models by tool calling, structured output, and open weights."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={state.toolCall}
                  onCheckedChange={(checked) =>
                    update({ toolCall: Boolean(checked) })
                  }
                />
                <span>Tool calling</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={state.structuredOutput}
                  onCheckedChange={(checked) =>
                    update({ structuredOutput: Boolean(checked) })
                  }
                />
                <span>Structured output</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={state.openWeights}
                  onCheckedChange={(checked) =>
                    update({ openWeights: Boolean(checked) })
                  }
                />
                <span>Open weights</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="limits">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Limits</span>
              <TooltipInfo
                label="Limits"
                description="Minimum context and output token requirements."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="min-context">Min context tokens</Label>
                <Input
                  id="min-context"
                  type="number"
                  inputMode="numeric"
                  value={state.minContext ?? ""}
                  onChange={(event) =>
                    update({ minContext: parseNumberInput(event.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="min-output">Min output tokens</Label>
                <Input
                  id="min-output"
                  type="number"
                  inputMode="numeric"
                  value={state.minOutput ?? ""}
                  onChange={(event) =>
                    update({ minOutput: parseNumberInput(event.target.value) })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="modalities">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Modalities</span>
              <TooltipInfo
                label="Modalities"
                description="Match input and output media types."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <div>
                <div className="text-muted-foreground text-xs">Input</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {modalitiesIn.map((modality) => (
                    <Button
                      key={modality}
                      type="button"
                      size="sm"
                      variant={
                        state.modalitiesIn.includes(modality)
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() =>
                        update({
                          modalitiesIn: toggleListValue(
                            state.modalitiesIn,
                            modality
                          ),
                        })
                      }
                    >
                      {modality}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Output</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {modalitiesOut.map((modality) => (
                    <Button
                      key={modality}
                      type="button"
                      size="sm"
                      variant={
                        state.modalitiesOut.includes(modality)
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() =>
                        update({
                          modalitiesOut: toggleListValue(
                            state.modalitiesOut,
                            modality
                          ),
                        })
                      }
                    >
                      {modality}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pricing">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Pricing</span>
              <TooltipInfo
                label="Pricing"
                description="Set max input/output prices per million tokens."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="max-price-in">Max input $/M tokens</Label>
                <Input
                  id="max-price-in"
                  type="number"
                  inputMode="decimal"
                  value={state.maxPriceIn ?? ""}
                  onChange={(event) =>
                    update({ maxPriceIn: parseNumberInput(event.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="max-price-out">Max output $/M tokens</Label>
                <Input
                  id="max-price-out"
                  type="number"
                  inputMode="decimal"
                  value={state.maxPriceOut ?? ""}
                  onChange={(event) =>
                    update({ maxPriceOut: parseNumberInput(event.target.value) })
                  }
                />
              </div>
              <div className="text-muted-foreground text-xs">
                Unknown prices are excluded when a max price is set.
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="providers">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Provider</span>
              <TooltipInfo
                label="Provider"
                description="Choose one or more providers to narrow results."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {providers.map((provider) => {
                const checked = state.providers.includes(provider.id)
                return (
                  <label
                    key={provider.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          update({
                            providers: toggleListValue(
                              state.providers,
                              provider.id
                            ),
                          })
                        }
                      />
                      <span>{provider.name ?? provider.id}</span>
                    </span>
                    {checked && <Badge variant="secondary">Active</Badge>}
                  </label>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="status">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>Status</span>
              <TooltipInfo
                label="Status"
                description="Hide deprecated models from the list."
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={state.hideDeprecated}
                onCheckedChange={(checked) =>
                  update({ hideDeprecated: Boolean(checked) })
                }
              />
              <span>Hide deprecated</span>
            </label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          onUpdate(
            {
              q: "",
              providers: [],
              modalitiesIn: [],
              modalitiesOut: [],
              toolCall: false,
              structuredOutput: false,
              openWeights: false,
              minContext: null,
              minOutput: null,
              maxPriceIn: null,
              maxPriceOut: null,
              hideDeprecated: false,
              page: 1,
              pageSize: state.pageSize,
              sort: state.sort,
              selected: state.selected,
            },
            { resetPage: true }
          )
        }
      >
        Clear filters
      </Button>
    </div>
  )
}
